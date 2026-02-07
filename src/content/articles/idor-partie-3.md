# IDOR : Les trucs que presque personne explique

*GraphQL, WebSockets, UUIDs, multi-tenant — les cas que presque personne explique.*

> [!TIP]
> **Cet article est en 3 parties :**
> - [Partie 1](/articles/idor-partie-1) — La méthode qui marche
> - [Partie 2](/articles/idor-partie-2) — Les conneries à éviter
> - **Partie 3** (tu es ici) — Les trucs que presque personne explique

---

## Le code qui crée des IDOR

Comprendre POURQUOI les IDOR existent t'aide à les trouver. Quand tu vois le code vulnérable, tu comprends le pattern et tu peux le reconnaître dans d'autres apps.

### Le problème fondamental

Une IDOR existe quand le code fait confiance à un ID fourni par l'utilisateur sans vérifier que cet utilisateur a le droit d'accéder à la ressource correspondante.

Ça paraît évident dit comme ça, mais dans le code c'est souvent moins visible.

### Pattern 1 : Pas de vérification du tout

Le cas le plus basique :

```javascript
// Node.js avec Express
app.get('/api/documents/:id', async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(document);
});
```

Ce code récupère un document par son ID et le retourne. Point. Il vérifie que le document existe (404 si pas trouvé), mais il ne vérifie JAMAIS que l'utilisateur connecté a le droit de le voir.

**Pourquoi ça arrive** : le dev se concentre sur la logique métier ("récupérer le document") et oublie l'access control. Ou il pense que le fait d'être authentifié suffit.

**La correction** :

```javascript
app.get('/api/documents/:id', async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    ownerId: req.user.id  // Filtre par propriétaire
  });
  if (!document) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(document);
});
```

Maintenant la query inclut un filtre sur le propriétaire. Si le document n'appartient pas à l'utilisateur, il n'est simplement pas trouvé.

### Pattern 2 : Vérification côté client uniquement

```javascript
// Frontend React
const DocumentViewer = ({ docId }) => {
  const { currentUser } = useAuth();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    // Check côté client
    if (doc && doc.ownerId !== currentUser.id) {
      setError("Access denied");
      return;
    }
    
    fetchDocument(docId).then(setDoc);
  }, [docId]);
  
  // ...
};
```

```javascript
// Backend
app.get('/api/documents/:id', async (req, res) => {
  // Pas de vérification ici, "le frontend gère"
  const document = await Document.findById(req.params.id);
  res.json(document);
});
```

Le frontend fait un check, mais le backend retourne le document sans vérifier. N'importe qui peut appeler l'API directement et bypasser le check frontend.

**Pourquoi ça arrive** : les équipes séparent frontend et backend. L'équipe frontend ajoute un check "pour l'UX" et l'équipe backend suppose que c'est suffisant.

**La règle d'or** : le frontend peut faire des checks pour l'expérience utilisateur, mais le backend DOIT toujours faire sa propre vérification. Ne jamais faire confiance au client.

### Pattern 3 : Auth sans authz

```javascript
// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;  // User authentifié
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Route protégée (?)
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  // Le middleware a vérifié que le user est connecté
  // Mais pas qu'il a le droit de supprimer CET user
  await User.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});
```

Le middleware d'auth vérifie que l'utilisateur est **authentifié** (il est qui il prétend être). Mais personne ne vérifie qu'il est **autorisé** à supprimer cet utilisateur spécifique.

**La confusion classique** : authentification ≠ autorisation.
- Authentification : "Qui es-tu ?" → vérifié par le middleware
- Autorisation : "As-tu le droit de faire ça ?" → pas vérifié

**La correction** :

```javascript
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  // L'user ne peut supprimer que lui-même (ou être admin)
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await User.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});
```

### Pattern 4 : Mass assignment

Exemple en Django/Python :

```python
def update_profile(request, user_id):
    user = User.objects.get(id=user_id)
    
    # Mass assignment : tous les champs du POST sont appliqués
    for key, value in request.POST.items():
        setattr(user, key, value)
    
    user.save()
    return JsonResponse({'status': 'updated'})
```

Ce code prend tous les champs envoyés dans la requête et les applique à l'objet user. Si l'attaquant envoie `{"role": "admin"}`, il devient admin.

**Pourquoi ça arrive** : les frameworks modernes encouragent le binding automatique des formulaires vers les objets. C'est pratique pour le dev mais dangereux si pas contrôlé.

**La correction** :

```python
def update_profile(request, user_id):
    # Vérifier que l'user modifie son propre profil
    if request.user.id != user_id:
        return HttpResponseForbidden()
    
    user = User.objects.get(id=user_id)
    
    # Whitelist explicite des champs modifiables
    allowed_fields = ['bio', 'avatar', 'display_name']
    for key, value in request.POST.items():
        if key in allowed_fields:
            setattr(user, key, value)
    
    user.save()
    return JsonResponse({'status': 'updated'})
```

### Pattern 5 : Références indirectes mal implémentées

Parfois les devs essaient de "cacher" les vrais IDs derrière des tokens ou des hashes :

```javascript
// "Sécurisation" par obscurité
app.get('/api/documents/:token', async (req, res) => {
  // Le token est juste l'ID en base64
  const docId = Buffer.from(req.params.token, 'base64').toString();
  const document = await Document.findById(docId);
  res.json(document);
});
```

L'ID `123` devient `MTIz` en base64. Le dev pense que c'est "sécurisé" parce que c'est pas directement visible. Mais c'est trivial à décoder.

**La vraie solution** :

Si tu veux utiliser des références indirectes, elles doivent être :
1. Aléatoires et impossibles à deviner (UUID v4 par exemple)
2. Mappées vers les vrais IDs côté serveur
3. Liées à la session de l'utilisateur
4. Avec une durée de vie limitée

```javascript
// Référence indirecte correcte
const tokenMap = new Map();

app.post('/api/documents/:id/share', authMiddleware, async (req, res) => {
  // Vérifie d'abord que l'user possède le document
  const doc = await Document.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  
  // Génère un token aléatoire temporaire
  const shareToken = crypto.randomUUID();
  tokenMap.set(shareToken, {
    docId: doc._id,
    createdBy: req.user.id,
    expiresAt: Date.now() + 3600000  // 1 heure
  });
  
  res.json({ shareUrl: `/shared/${shareToken}` });
});
```

---

## Les contextes modernes qu'on oublie

Les guides IDOR classiques parlent de `?id=123` dans une URL. Mais les applications modernes utilisent des patterns différents qui créent des surfaces d'attaque spécifiques.

### GraphQL : le buffet à volonté

GraphQL change fondamentalement la façon dont les clients demandent des données. Au lieu d'appeler des endpoints prédéfinis, le client construit sa propre requête et demande exactement les champs qu'il veut.

**Pourquoi c'est un terrain fertile pour les IDOR**

Dans une API REST classique, le dev doit explicitement créer un endpoint pour chaque type de requête. Avec GraphQL, il définit un schéma et le client peut requêter n'importe quelle combinaison.

Le frontend demande peut-être :
```graphql
query {
  me {
    name
    email
  }
}
```

Mais le schéma GraphQL expose peut-être :
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  phone: String
  address: String
  creditCards: [CreditCard!]
  role: String!
  passwordHash: String  # Oups
}

type Query {
  me: User
  user(id: ID!): User  # Accessible à tous ?
  users: [User!]       # Liste tous les users ?
}
```

**Les attaques spécifiques à GraphQL**

**1. Accès direct via query avec argument**

Le frontend appelle `me`, mais le schéma a aussi `user(id)` :

```graphql
query {
  user(id: "456") {
    name
    email
    phone
    creditCards {
      number
      cvv
    }
  }
}
```

Le dev a peut-être sécurisé `me` mais oublié que `user(id)` existe aussi.

**2. Over-fetching de champs**

Même si tu accèdes légitimement à une ressource, tu peux demander des champs que le frontend n'utilise pas :

```graphql
query {
  me {
    name
    email
    role           # Est-ce que j'ai le droit de voir ça ?
    passwordHash   # Et ça ?
    apiKeys {      # Et ça ?
      key
      secret
    }
  }
}
```

Le schéma expose ces champs, donc ils sont techniquement accessibles. Le dev a peut-être pensé "le frontend ne les demande pas" sans ajouter de vérification côté serveur.

**3. Batching pour énumération massive**

GraphQL permet de faire plusieurs requêtes en une seule grâce aux aliases :

```graphql
query {
  u1: user(id: "1") { id email }
  u2: user(id: "2") { id email }
  u3: user(id: "3") { id email }
  u4: user(id: "4") { id email }
  # ... jusqu'à des centaines
}
```

Une seule requête HTTP, des dizaines/centaines d'utilisateurs récupérés. Ça bypass souvent le rate limiting qui compte les requêtes HTTP, pas les opérations GraphQL.

**4. Nested queries pour traverse le graphe**

GraphQL est... un graphe. Tu peux naviguer les relations :

```graphql
query {
  me {
    organization {
      users {        # Tous les users de mon org
        id
        email
        documents {  # Tous leurs documents
          id
          content
        }
      }
    }
  }
}
```

Même si tu n'as pas directement accès aux documents d'autres users, tu peux peut-être les atteindre en passant par les relations.

**5. Mutations avec IDs manipulables**

Les mutations GraphQL qui prennent un ID en argument sont des cibles IDOR classiques :

```graphql
mutation {
  updateDocument(id: "doc-456", title: "Nouveau titre") {
    success
  }
}
```

Pour les mutations destructives (`deleteDocument`, etc.), applique la même règle que pour REST : tu peux prouver une absence de contrôle d'autorisation sans supprimer la ressource de quelqu'un d'autre, en montrant que tu n'obtiens pas d'erreur d'accès (ex: pas de `FORBIDDEN`) et que le serveur traite vraiment la mutation (réponse de validation/précondition, etc.). Documente ça proprement.

**Comment tester**

1. **Récupère le schéma** via introspection (si pas désactivée) :
```graphql
query {
  __schema {
    types {
      name
      fields {
        name
        args { name type { name } }
      }
    }
  }
}
```

2. **Identifie les queries/mutations avec des arguments `id`**

3. **Teste l'accès avec des IDs qui ne t'appartiennent pas**

4. **Teste le batching** pour voir si le rate limiting s'applique

5. **Explore les champs disponibles** au-delà de ce que le frontend utilise

### WebSockets : le Far West

Les WebSockets établissent une connexion persistante bidirectionnelle entre le client et le serveur. Après le handshake initial, les messages circulent librement.

**Pourquoi c'est souvent vulnérable**

1. **L'auth est faite au handshake, pas sur chaque message** : le serveur vérifie que tu es authentifié quand tu te connectes, mais ensuite il traite tous les messages sans re-vérifier.

2. **Pas de verbes HTTP** : dans REST, DELETE et GET sont distincts. En WebSocket, tout est juste un "message" avec un payload JSON. Facile d'oublier les checks.

3. **Moins de tooling** : les proxies et scanners de sécu sont moins matures pour WebSocket que pour HTTP. Les devs testent moins.

**Anatomie d'une connexion WebSocket**

```javascript
// Client
const ws = new WebSocket('wss://app.example.com/ws?token=abc123');

ws.onopen = () => {
  // Connexion établie, authentifiée via le token dans l'URL
  ws.send(JSON.stringify({
    type: 'getDocument',
    documentId: 'doc-123'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);  // Le document
};
```

```javascript
// Server (vulnérable)
wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://x').searchParams.get('token');
  const user = verifyToken(token);  // Auth au handshake
  
  if (!user) {
    ws.close();
    return;
  }
  
  ws.on('message', async (message) => {
    const { type, documentId } = JSON.parse(message);
    
    if (type === 'getDocument') {
      // Pas de vérification que le user possède ce document !
      const doc = await Document.findById(documentId);
      ws.send(JSON.stringify(doc));
    }
  });
});
```

**Comment tester**

1. **Intercepte le trafic WebSocket** : la plupart des proxies modernes (Caido, Burp) supportent l'interception WebSocket.

2. **Identifie les messages avec des IDs** : cherche des patterns comme `{"id": "xxx"}`, `{"documentId": "xxx"}`, `{"targetUser": "xxx"}`.

3. **Modifie les IDs et renvoie** : change l'ID dans le message et observe la réponse.

4. **Teste les différentes actions** : subscribe à des channels d'autres users, envoie des messages comme d'autres users, etc.

**Exemple concret d'attaque**

Une app de chat temps réel :
```javascript
// Message légitime
ws.send(JSON.stringify({
  type: 'joinRoom',
  roomId: 'room-123'  // Ma room
}));

// IDOR
ws.send(JSON.stringify({
  type: 'joinRoom',
  roomId: 'room-456'  // Room privée d'autres users
}));

// Si ça marche, je reçois tous les messages de cette room
```

### Server Actions (Next.js, Remix, etc.)

Les frameworks React modernes ont introduit les "Server Actions" : des fonctions qui s'exécutent côté serveur mais sont appelées comme des fonctions normales côté client.

**Le piège**

```typescript
// app/actions.ts (Next.js)
'use server'

export async function deletePost(postId: string) {
  // Cette fonction s'exécute côté serveur
  await db.post.delete({ where: { id: postId } });
  revalidatePath('/posts');
}
```

```typescript
// app/posts/[id]/page.tsx
import { deletePost } from '@/app/actions';

export default function PostPage({ params }) {
  return (
    <form action={deletePost.bind(null, params.id)}>
      <button type="submit">Delete</button>
    </form>
  );
}
```

Le dev pense peut-être "c'est une fonction serveur, c'est sécurisé". Mais c'est exactement comme un endpoint HTTP. Next.js expose cette fonction via une route comme `/_next/...` ou avec un payload spécial.

**Pourquoi c'est vulnérable**

1. **L'abstraction cache la surface d'attaque** : ça ressemble à un appel de fonction, mais c'est une requête HTTP.

2. **Les checks sont souvent oubliés** : le dev se concentre sur la logique métier, pas sur l'autorisation.

3. **Le binding d'arguments facilite les IDOR** : `deletePost.bind(null, params.id)` — l'ID vient de l'URL, facilement manipulable.

**Comment tester**

1. **Identifie les Server Actions** : cherche `'use server'` dans le code (si open source) ou les requêtes vers `/_next/` avec des payloads inhabituels.

2. **Intercepte l'appel** : utilise ton proxy pour capturer la requête quand tu utilises légitimement la fonctionnalité.

3. **Modifie les arguments** : l'ID est souvent passé dans le body de la requête, modifie-le.

4. **Vérifie l'effet** : est-ce que la ressource de quelqu'un d'autre a été affectée ?

### gRPC : le nouveau REST

De plus en plus d'applications, surtout en microservices, utilisent gRPC plutôt que REST. C'est un protocole binaire basé sur Protocol Buffers.

**Pourquoi c'est pertinent pour les IDOR**

gRPC a les mêmes problèmes fondamentaux que REST :
- Des IDs passés en paramètres
- Des vérifications d'autorisation oubliées
- Une confusion auth/authz

**Exemple de définition vulnérable**

```protobuf
// user.proto
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (Empty);
}

message GetUserRequest {
  string user_id = 1;
}

message DeleteUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  string phone = 4;
}
```

Si le serveur ne vérifie pas que le `user_id` demandé correspond à l'utilisateur authentifié, c'est une IDOR.

**Comment tester**

1. **Identifie les endpoints gRPC** : souvent sur le port 443 avec HTTP/2, ou sur un port dédié.

2. **Récupère le schéma** : via gRPC reflection (si activé) ou en analysant le code client.

3. **Utilise un client gRPC** :
   - [grpcurl](https://github.com/fullstorydev/grpcurl) en CLI
   - [Kreya](https://kreya.app/) pour une interface graphique
   - [Postman](https://www.postman.com/) supporte gRPC maintenant

4. **Forge des requêtes avec des IDs modifiés** :
```bash
grpcurl -d '{"user_id": "456"}' \
  -H 'Authorization: Bearer xxx' \
  app.example.com:443 \
  UserService/GetUser
```

---

## L'attaque sandwich sur les UUIDs

"On utilise des UUIDs, c'est impossible à deviner."

C'est vrai pour les UUID v4 (aléatoires). C'est faux pour les UUID v1 (basés sur le temps).

### Anatomie d'un UUID

Un UUID ressemble à ça : `550e8400-e29b-41d4-a716-446655440000`

Il est composé de 5 groupes séparés par des tirets. Le **13ème caractère** (premier du 3ème groupe) indique la version :

- `1` → UUID v1 (basé sur timestamp + MAC address)
- `4` → UUID v4 (aléatoire)
- Autres versions existent mais sont plus rares

**UUID v1** : `550e8400-e29b-`**1**`1d4-a716-446655440000`
**UUID v4** : `550e8400-e29b-`**4**`1d4-a716-446655440000`

### Comment fonctionne un UUID v1

Un UUID v1 est construit à partir de :
- Un **timestamp** (100-nanosecond intervals depuis le 15 octobre 1582)
- Un **clock sequence** (pour gérer les cas où l'horloge recule)
- Un **node ID** (généralement l'adresse MAC de la machine)

Le timestamp est encodé dans les trois premiers groupes (de manière non-évidente, mais décodable).

### L'attaque sandwich

Si deux UUIDs v1 sont générés sur la même machine à des moments proches, leur timestamp sera proche. Si tu connais deux UUIDs générés "autour" d'un troisième, tu peux calculer l'intervalle et réduire drastiquement l'espace de recherche.

**Le scénario classique : password reset**

1. Tu demandes un reset de mot de passe pour **ton** compte → Tu reçois un lien avec un UUID1
2. Tu demandes un reset pour le compte **victime** → La victime reçoit un lien avec un UUID inconnu
3. Tu demandes un autre reset pour **ton** compte → Tu reçois un lien avec un UUID2

L'UUID de la victime est "sandwiché" entre tes deux UUIDs connus.

**Le truc important que tout le monde oublie** : en bug bounty, tu ne "bruteforces" pas comme un singe en prod. L'objectif ici, c'est surtout de :
- diagnostiquer que c'est bien du UUID v1
- montrer que l'intervalle est petit
- et démontrer la prédictibilité de manière responsable (souvent avec un échantillon, ou en environnement autorisé)

**Calcul de l'intervalle**

Si tu décodes les timestamps :
- UUID1 généré à T1
- UUID2 généré à T2
- UUID victime généré entre T1 et T2

Plus T2-T1 est petit, plus c'est réaliste. Si c'est quelques secondes, l'espace de recherche peut être "humainement" exploitable selon les protections en place. Si c'est des minutes/heures, ça devient vite théorique.

### L'outil de Lupin

L'équipe L&H Security a documenté cette attaque et publié un outil open-source : [github.com/Lupin-Holmes/sandwich](https://github.com/Lupin-Holmes/sandwich)

L'outil :
1. Prend deux UUIDs v1 en entrée (tes "tranches de pain")
2. Génère tous les UUIDs possibles dans l'intervalle
3. Tu peux ensuite les tester contre l'endpoint de reset

### Conditions nécessaires

L'attaque ne fonctionne que si :
1. L'application utilise des UUID **v1** (check le 13ème caractère)
2. Les UUIDs sont générés sur la **même machine** (même node ID)
3. Tu peux obtenir des UUIDs **avant et après** celui de la victime
4. L'intervalle de temps est **raisonnable** (pas des heures)
5. L'endpoint de reset n'a pas de **rate limiting** agressif
6. Et surtout : les règles du programme te permettent ce type de test

### Où les UUIDs v1 leakent

Même les UUID v4 ne sont pas une protection s'ils sont exposés. Cherche-les :

- **Dans les réponses API** : souvent le serveur retourne l'UUID de la ressource créée
- **Dans les URLs** : `/documents/550e8400-e29b-41d4-a716-446655440000`
- **Dans le JavaScript frontend** : les apps SPA stockent souvent des IDs dans le state
- **Dans les emails** : les liens de confirmation, partage, reset contiennent des UUIDs
- **Dans les exports** : CSV, PDF générés par l'app
- **Dans les logs exposés** : si l'app a des logs accessibles
- **Dans les messages d'erreur** : "Document 550e8400-... not found"

---

## Quand lâcher l'affaire

L'IDOR c'est bien, mais faut savoir quand passer à autre chose. Voici des signaux pour évaluer si ça vaut le coup de continuer.

### Signaux positifs (continue)

**IDs séquentiels ou courts**
```
user_id=1, user_id=2, user_id=3...
```
Si les IDs sont séquentiels, l'énumération est triviale et l'impact potentiel est élevé. Continue.

**Pas de framework auth visible**
L'app utilise du JWT maison, des sessions custom, ou un truc fait main. Les frameworks matures (Rails, Django, Spring Security) ont généralement des patterns d'autorisation bien établis. Le code custom a plus de chances d'avoir des oublis.

**Erreurs verbeuses**
```
GET /api/users/99999999
→ 404 {"error": "User 99999999 not found"}

GET /api/users/123
→ 403 {"error": "Access denied to user 123"}
```

Si l'app te dit **quel** user n'existe pas vs lequel existe mais t'es pas autorisé, c'est un signe que l'access control est fait au cas par cas, pas de manière systématique.

**Multi-tenant sans isolation claire**
Les apps SaaS qui n'ont pas de séparation évidente entre tenants (pas de `org_id` visible, pas de sous-domaines) ont souvent des problèmes d'isolation.

**App legacy ou startup early-stage**
Les vieilles apps ont accumulé de la dette technique. Les startups en MVP ont souvent sacrifié la sécurité pour la vitesse. Dans les deux cas, les chances d'IDOR sont plus élevées.

**Admin panel accessible**
Si tu peux accéder à `/admin` ou `/dashboard` même partiellement, y'a des chances que les endpoints admin soient moins bien sécurisés que les endpoints user.

### Signaux négatifs (passe à autre chose)

**UUIDs v4 partout, aucun leak**
Si tous les IDs sont des UUIDs v4, qu'ils ne leakent nulle part, et que tu ne peux pas les deviner, les chances d'IDOR exploitable sont faibles. L'obscurité n'est pas de la sécurité, mais ça rend l'exploitation beaucoup plus difficile.

**Réponses uniformes**
```
GET /api/users/123 (existe, pas à toi) → 404
GET /api/users/999999 (n'existe pas) → 404
```

Si l'app retourne la même erreur que la ressource existe ou non, elle a probablement été conçue avec la sécurité en tête.

**Framework mature avec RBAC visible**
Rails avec Pundit/CanCanCan, Django avec django-guardian, Spring Security avec @PreAuthorize... Ces patterns sont battle-tested. Pas impossible à bypass, mais plus rare.

**Rate limiting agressif**
Si tu te fais rate-limit après 10 requêtes de test, ça va être compliqué d'explorer sérieusement. À moins d'avoir une IDOR évidente sur la première requête.

**Headers de sécurité stricts**
Une app avec CSP strict, HSTS, X-Frame-Options, etc. a probablement une équipe qui pense à la sécurité. Pas une garantie, mais un signal.

### Temps raisonnable

- **Test basique** (méthode 2-comptes manuelle sur les endpoints principaux) : 30-45 min
- **Test approfondi** (tous les endpoints, tous les verbes, paramètres cachés) : 2-4h
- **Si rien après 4h sur une app moderne** : passe à autre chose ou change d'angle d'attaque

Le temps c'est de l'argent. Si t'as passé 4h sans rien trouver sur une app qui a tous les signaux négatifs, ta probabilité de succès en continuant est faible. Mieux vaut passer à une autre cible ou un autre type de vuln.

---

## Checklist avant de reporter

```
□ J'ai testé les verbes HTTP sur MES propres ressources d'abord
□ J'ai vérifié l'accès (pas l'exécution) des endpoints sensibles avec d'autres IDs
□ Je n'ai PAS supprimé ou modifié de manière destructive les ressources d'autres users
□ J'ai documenté l'impact réel avec des exemples concrets
□ J'ai des preuves reproductibles (requêtes curl, screenshots)
□ J'ai testé sur 3-5 IDs pour confirmer le pattern (pas d'énumération massive)
□ J'ai vérifié que c'est pas un comportement attendu (profils publics, etc.)
□ J'ai cherché l'escalade de manière responsable (lecture d'abord, modifications non destructives ensuite)
□ Mon rapport explique l'impact business, pas juste technique
□ J'ai respecté les règles du programme
```

---

## Ressources qui valent le coup

- [PortSwigger Academy — Access Control](https://portswigger.net/web-security/access-control) — Labs interactifs pour pratiquer
- [Sandwich Attack — L&H Security](https://www.landh.tech/blog/20230811-sandwich-attack/) — L'attaque UUID v1 en détail
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) — Sécurité GraphQL
- [HackTricks — IDOR](https://book.hacktricks.wiki/en/pentesting-web/idor.html) — Référence technique complète
- [Caido Autorize](https://docs.caido.io/app/tutorials/autorize) — Documentation officielle du plugin
- [Autorize GitHub](https://github.com/caido-community/autorize) — Code source et issues

---

## Le mot de la fin

L'IDOR, c'est changer un numéro et voir ce qui se passe. C'est con. C'est efficace. Et c'est toujours là parce que les devs continuent de confondre "connecté" et "autorisé".

La différence entre le hunter qui trouve et celui qui trouve pas, c'est rarement la technique. C'est la méthode : deux comptes, tous les verbes, vérifier les side-effects, chercher l'escalade. Et surtout, la patience de tester systématiquement au lieu de sauter aux conclusions.

Maintenant arrête de lire des articles et va tester des trucs.

---

*Disclaimer obligatoire : teste uniquement sur des programmes autorisés où tu as une permission explicite. Respecte les règles de chaque programme — notamment sur les actions destructives et l'extraction de données. Le bug bounty c'est légal quand tu restes dans le cadre. Hors cadre, c'est la prison.*


---

> [!INFO]
> **Navigation :**
> - [← Partie 1 : Les fondamentaux](/articles/idor-partie-1)
> - [← Partie 2 : Automatisation & Erreurs](/articles/idor-partie-2)
