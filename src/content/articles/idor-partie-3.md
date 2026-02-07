# IDOR : Les trucs que presque personne explique

*GraphQL, WebSockets, UUIDs — là où les guides classiques s'arrêtent.*

> [!TIP]
> **Cet article est en 3 parties :**
> - [Partie 1](/articles/idor-partie-1) — La méthode qui marche
> - [Partie 2](/articles/idor-partie-2) — Les conneries à éviter
> - **Partie 3** (tu es ici) — Les trucs que presque personne explique

---

Si t'as lu les deux premières parties, tu sais tester les IDOR sur une API REST classique. Félicitations, t'es au niveau de 2015. 

Le problème c'est que les apps en 2026, c'est du GraphQL, des WebSockets, des Server Actions Next.js, et des architectures multi-tenant où t'as trois niveaux d'IDs imbriqués. Les guides IDOR classiques te laissent dans le noir sur tout ça.

Cette partie, c'est pour combler ce trou.

---

## Pourquoi les devs créent des IDOR

Avant d'attaquer les cas modernes, un détour par le code. Comprendre POURQUOI les IDOR existent te rend meilleur pour les trouver.

### Le pattern de base

Une IDOR, c'est quand le code fait confiance à un ID fourni par l'utilisateur sans vérifier qu'il a le droit d'accéder à la ressource. Ça paraît con dit comme ça, mais regarde ce code Node.js :

```javascript
app.get('/api/documents/:id', async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(document);
});
```

Le dev a vérifié que le document existe. Il a pas vérifié que t'as le droit de le voir. Pour lui, "l'utilisateur est connecté" = "l'utilisateur peut tout faire". C'est la confusion auth/authz classique.

La correction tient en une ligne :

```javascript
const document = await Document.findOne({
  _id: req.params.id,
  ownerId: req.user.id  // ← ça change tout
});
```

### "Le frontend gère"

Mon préféré. Le frontend React fait un check :

```javascript
if (doc.ownerId !== currentUser.id) {
  setError("Access denied");
  return;
}
```

Et le backend retourne le document sans vérifier parce que "le frontend gère". Sauf que n'importe qui peut appeler l'API directement avec curl et le check frontend, il s'en tape.

J'ai vu ça sur des apps en prod avec des millions d'utilisateurs. L'équipe frontend ajoute un check "pour l'UX", l'équipe backend suppose que c'est suffisant, personne se parle. Résultat : IDOR.

### Le middleware qui vérifie l'auth mais pas l'authz

```javascript
const authMiddleware = (req, res, next) => {
  const user = verifyToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  req.user = user;
  next();
};

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
```

Le middleware vérifie que t'es connecté. L'endpoint supprime le post. Personne vérifie que c'est TON post. Le dev s'est dit "y'a un middleware d'auth, c'est bon" sans réaliser qu'authentification ≠ autorisation.

---

## GraphQL : le buffet à volonté

GraphQL change la donne. Au lieu d'appeler des endpoints fixes, le client construit sa propre requête et demande ce qu'il veut. C'est puissant pour le dev. C'est un cauchemar pour la sécurité.

### Le problème fondamental

Le frontend demande peut-être juste ça :

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
  creditCards: [CreditCard!]
  role: String!
  passwordHash: String  # oups
}

type Query {
  me: User
  user(id: ID!): User    # accessible à tous ?
  users: [User!]         # liste tous les users ?
}
```

Le dev a sécurisé `me`. Il a oublié que `user(id)` existe aussi dans le schéma. Ou il pensait que personne irait regarder.

### Ce que tu fais

**1. Introspection d'abord**

Avant tout, tu veux voir le schéma complet :

```graphql
{
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

Si l'introspection est activée (souvent le cas en dev, parfois oublié en prod), tu vois tout ce que l'API expose. Cherche les queries avec des arguments `id`, `userId`, `documentId` — c'est là que les IDOR se cachent.

**2. Accès direct**

Le frontend utilise `me`, toi tu testes `user(id)` :

```graphql
query {
  user(id: "456") {
    name
    email
    phone
    creditCards { number cvv }
  }
}
```

**3. Over-fetching**

Même si t'accèdes légitimement à une ressource, demande des champs que le frontend n'utilise pas :

```graphql
query {
  post(id: "123") {
    title
    content
    author {
      email
      phone
      role
      internalNotes  # le frontend demande jamais ça
    }
  }
}
```

**4. Nested queries**

GraphQL permet de traverser les relations. Si tu peux accéder à un post, tu peux peut-être accéder à des trucs via ce post :

```graphql
query {
  post(id: "mon-post") {
    comments {
      author {
        id
        privateMessages {  # IDOR via traversée
          content
        }
      }
    }
  }
}
```

**5. Mutations**

Les queries c'est la lecture. Les mutations c'est l'écriture. Même logique, mêmes problèmes :

```graphql
mutation {
  updateUser(id: "456", input: { role: "admin" }) {
    id
    role
  }
}
```

### Les outils

- **GraphQL Voyager** : visualise le schéma en graphe
- **InQL** (extension Burp) : scan automatique des vulns GraphQL
- **graphql-cop** : détecte les misconfigs

---

## WebSockets : l'oublié

Les WebSockets, c'est la communication temps réel. Chat, notifications, dashboards live. Et c'est un nid à IDOR parce que personne pense à les tester.

### Pourquoi c'est vulnérable

Trois raisons :

L'auth est faite au handshake. Le serveur vérifie ton token quand tu te connectes, puis il traite tous tes messages sans re-vérifier. Comme si un videur te checkait à l'entrée du club et qu'après tu pouvais aller dans toutes les salles VIP.

Pas de verbes HTTP. En REST, GET et DELETE sont distincts. En WebSocket, tout est un "message" avec du JSON. C'est plus facile d'oublier les checks quand tout ressemble à tout.

Moins de tooling. Les proxies et scanners sont moins matures pour WebSocket. Les devs testent moins, les hunters aussi.

### À quoi ça ressemble

Côté client :
```javascript
const ws = new WebSocket('wss://app.example.com/ws?token=abc123');

ws.send(JSON.stringify({
  type: 'getDocument',
  documentId: 'doc-123'
}));
```

Côté serveur (vulnérable) :
```javascript
wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://x').searchParams.get('token');
  const user = verifyToken(token);
  
  if (!user) {
    ws.close();
    return;
  }
  
  ws.on('message', async (message) => {
    const { type, documentId } = JSON.parse(message);
    
    if (type === 'getDocument') {
      // Pas de vérification de propriété !
      const doc = await Document.findById(documentId);
      ws.send(JSON.stringify(doc));
    }
  });
});
```

L'auth est faite au handshake. Après, tous les messages sont traités sans vérifier que le user a le droit d'accéder au document demandé.

### Comment tu testes

Intercepte le trafic WebSocket (Caido et Burp le font). Cherche les messages avec des IDs. Change les IDs. Observe.

Un exemple concret — une app de chat :

```javascript
// Message légitime
ws.send(JSON.stringify({ type: 'joinRoom', roomId: 'room-123' }));

// IDOR : tu rejoins la room privée de quelqu'un d'autre
ws.send(JSON.stringify({ type: 'joinRoom', roomId: 'room-456' }));
```

Si ça marche, tu reçois tous les messages de cette room. Boom.

---

## Server Actions : le nouveau piège

Next.js, Remix, et compagnie ont introduit les "Server Actions" — des fonctions qui tournent côté serveur mais qu'on appelle comme des fonctions normales côté client. C'est magique pour le dev. C'est un piège pour la sécurité.

```typescript
// app/actions.ts
'use server'

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } });
  revalidatePath('/posts');
}
```

Cette fonction est marquée `'use server'`, donc elle s'exécute côté serveur. Mais elle est exposée comme un endpoint HTTP sous le capot. Et devine quoi — y'a pas de vérification de propriété.

Le dev voit une fonction. Toi tu vois un endpoint HTTP non protégé.

Pour tester, intercepte les requêtes quand tu déclenches l'action depuis le frontend. Tu verras des POST vers des URLs style `/_next/actions/...` avec des payloads. Modifie les IDs dans le payload.

---

## L'attaque sandwich sur les UUIDs

"On utilise des UUIDs, c'est impossible à deviner."

C'est vrai pour les UUID v4 (aléatoires). C'est faux pour les UUID v1.

### La différence

Un UUID ressemble à ça : `550e8400-e29b-11d4-a716-446655440000`

Le 13ème caractère te dit la version :
- `1` → UUID v1 (basé sur le temps)
- `4` → UUID v4 (aléatoire)

UUID v1 : `550e8400-e29b-`**1**`1d4-a716-...`  
UUID v4 : `550e8400-e29b-`**4**`1d4-a716-...`

### Pourquoi UUID v1 est vulnérable

Un UUID v1 est construit à partir du timestamp + clock sequence + adresse MAC de la machine. Le timestamp est encodé dans les trois premiers groupes.

Si deux UUIDs v1 sont générés sur la même machine à des moments proches, leurs timestamps seront proches. Et si tu connais deux UUIDs générés "autour" d'un troisième, tu peux calculer l'intervalle.

### Le scénario classique

Tu veux le lien de reset password d'une victime.

1. Tu demandes un reset pour **ton** compte → Tu reçois un lien avec un UUID (t'appelles ça UUID1)
2. Tu demandes un reset pour la **victime** → Elle reçoit un lien avec un UUID inconnu
3. Tu demandes un autre reset pour **toi** → Tu reçois UUID2

L'UUID de la victime est "sandwiché" entre UUID1 et UUID2. Si l'intervalle est petit (quelques secondes), l'espace de recherche devient gérable.

### L'outil

L'équipe L&H Security a publié [sandwich](https://github.com/Lupin-Holmes/sandwich) — tu lui files tes deux UUIDs et il génère tous les UUIDs possibles dans l'intervalle.

Évidemment, ça marche que si :
- C'est vraiment des UUID v1
- Ils sont générés sur la même machine
- L'intervalle est petit
- Y'a pas de rate limiting agressif
- Le programme autorise ce type de test

En bug bounty, tu vas rarement bruteforcer en prod. L'objectif c'est surtout de prouver que les UUIDs sont v1 et que l'intervalle est exploitable. Ça suffit souvent pour un rapport.

---

## Multi-tenant : l'isolation fantôme

Les apps SaaS ont des organisations. Chaque org a ses users, ses données, son espace. En théorie. En pratique, l'isolation est souvent une illusion.

### Les trois niveaux d'IDs

Dans une app multi-tenant, t'as généralement :
- `user_id` : l'utilisateur
- `org_id` : l'organisation
- `resource_id` : la ressource (document, projet, etc.)

Les devs pensent souvent à vérifier le `user_id`. Ils oublient le `org_id`.

### L'attaque

T'as deux comptes dans deux orgs différentes. Compte A dans Org-1, Compte B dans Org-2.

1. Avec le compte A, tu crées une ressource et tu notes son ID
2. Tu te connectes avec le compte B (autre org)
3. Tu essaies d'accéder à la ressource du compte A

Si ça marche, t'as une IDOR cross-tenant. C'est généralement critique parce que ça casse l'isolation entre clients.

### Où chercher

Les endpoints d'admin sont souvent moins bien protégés. `/api/admin/users`, `/api/admin/settings`, `/api/admin/billing`. Les devs mettent un check "is_admin" mais oublient de vérifier que l'admin appartient à la bonne org.

Les fonctionnalités de partage aussi. "Inviter un user dans l'org", "Partager un document avec une autre org". Ces features traversent volontairement les frontières d'isolation, donc les checks sont plus complexes et souvent incomplets.

---

## Quand lâcher l'affaire

L'IDOR c'est bien, mais faut savoir quand passer à autre chose.

### Continue si...

**Les IDs sont séquentiels.** `user_id=1, 2, 3...` — l'énumération est triviale, y'a forcément des trucs à trouver.

**L'app utilise de l'auth maison.** JWT custom, sessions bricolées, tokens faits main. Les frameworks matures (Rails, Django, Spring Security) ont des patterns d'autorisation battle-tested. Le code custom a plus de chances d'avoir des trous.

**Les erreurs sont verbeuses.** Si l'app te dit "User 123 not found" vs "Access denied to user 456", ça veut dire que l'access control est fait au cas par cas, pas de manière systématique.

**C'est une app legacy ou une startup early-stage.** Les vieilles apps ont de la dette technique. Les startups en MVP ont sacrifié la sécurité pour la vitesse. Dans les deux cas, jackpot probable.

### Passe à autre chose si...

**UUID v4 partout et aucun leak.** Si tous les IDs sont des UUIDs v4, qu'ils n'apparaissent nulle part, et que tu peux pas les deviner, les chances sont faibles.

**Les réponses sont uniformes.** L'app retourne 404 que la ressource existe ou non ? Elle a été conçue avec la sécurité en tête.

**Rate limiting agressif.** Tu te fais ban après 10 requêtes ? Va falloir être créatif ou passer à autre chose.

**T'as passé 4h sans rien trouver.** Le temps c'est de l'argent. Si t'as testé méthodiquement pendant 4h sur une app moderne avec tous les signaux négatifs, ta probabilité de succès en continuant est proche de zéro.

---

## Avant de reporter

Quelques questions à te poser :

T'as testé sur TES ressources d'abord ? Tu devrais jamais supprimer ou modifier les données d'autres users.

T'as des preuves reproductibles ? Des requêtes curl, des screenshots, pas juste "j'ai vu un truc".

T'as vérifié que c'est pas un comportement attendu ? Des profils publics, des données partagées volontairement, ça existe.

T'as cherché l'escalade ? Une IDOR de lecture c'est bien. Une IDOR de lecture qui mène à une IDOR d'écriture qui mène à un account takeover, c'est mieux.

Ton rapport explique l'impact business ? "Je peux lire les documents des autres users" c'est technique. "Un attaquant peut accéder aux contrats confidentiels de n'importe quel client" c'est business.

---

## Ressources

Si t'as lu jusqu'ici et que t'en veux encore :

- [PortSwigger Academy — Access Control](https://portswigger.net/web-security/access-control) : des labs pour pratiquer
- [Sandwich Attack — L&H Security](https://www.landh.tech/blog/20230811-sandwich-attack/) : l'attaque UUID v1 en détail
- [HackTricks — IDOR](https://book.hacktricks.wiki/en/pentesting-web/idor.html) : référence technique
- [Caido Autorize](https://github.com/caido-community/autorize) : le plugin dont on a parlé en partie 2

---

## Fin

L'IDOR c'est changer un numéro et voir ce qui se passe. C'est con. C'est efficace. Et c'est toujours là parce que les devs continuent de confondre "connecté" et "autorisé".

Maintenant arrête de lire et va tester des trucs.

---

*Disclaimer : teste uniquement sur des programmes où t'as une autorisation explicite. Le bug bounty c'est légal dans le cadre. Hors cadre, c'est la prison.*

---

> [!INFO]
> **Navigation :**
> - [← La méthode qui marche](/articles/idor-partie-1)
> - [← Les conneries à éviter](/articles/idor-partie-2)
