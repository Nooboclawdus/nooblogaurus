# IDOR : Les trucs que presque personne explique

*GraphQL, WebSockets, UUIDs — les trucs que 90% des articles IDOR ignorent.*

> [!TIP]
> **Cet article est en 3 parties :**
> - [Partie 1](/articles/idor-partie-1) — La méthode qui marche
> - [Partie 2](/articles/idor-partie-2) — Les conneries à éviter
> - **Partie 3** (tu es ici) — Les trucs que presque personne explique

---

Si t'as lu les deux premières parties, tu sais tester les IDOR sur une API REST classique. Félicitations, t'es au niveau de 2015. 

Le problème c'est que les apps en 2026, c'est du GraphQL, des WebSockets, des Server Actions Next.js, et des architectures multi-tenant où t'as trois niveaux d'IDs imbriqués. Les articles IDOR classiques te laissent dans le noir sur tout ça.

Cette partie, c'est pour combler ce trou.

<!-- DIAGRAM:surfaces -->

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

Le frontend demande peut-être juste ton nom et ton email via la query `me`. Mais le schéma GraphQL expose probablement beaucoup plus : une query `user(id)` qui prend n'importe quel ID, une query `users` qui liste tout le monde, et des champs comme `phone`, `creditCards`, ou même `passwordHash` que le frontend n'utilise jamais mais qui sont quand même accessibles.

Le dev a sécurisé `me`. Il a oublié que `user(id)` existe aussi dans le schéma. Ou il pensait que personne irait regarder.

### Ce que tu fais

Tu commences par l'introspection. Si elle est activée (souvent le cas en dev, parfois oubliée en prod), tu peux voir le schéma complet avec une simple query `__schema`. Ça te montre toutes les queries disponibles, tous les types, tous les champs. Cherche les queries avec des arguments `id`, `userId`, `documentId` — c'est là que les IDOR se cachent.

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

Ensuite tu testes l'accès direct. Le frontend utilise `me`, toi tu testes `user(id: "456")` avec l'ID d'un autre utilisateur. Tu demandes tous les champs que tu peux : email, phone, creditCards, role, tout ce qui est dans le schéma.

Tu peux aussi faire de l'over-fetching : même quand t'accèdes légitimement à une ressource, demande des champs que le frontend n'utilise pas. Un post a peut-être un champ `author.internalNotes` qui n'est jamais affiché mais qui est quand même accessible.

GraphQL permet aussi de traverser les relations avec des nested queries. Si tu peux accéder à un post, tu peux peut-être accéder aux commentaires de ce post, puis aux auteurs de ces commentaires, puis aux messages privés de ces auteurs. C'est IDOR par traversée.

Et oublie pas les mutations. Les queries c'est la lecture, les mutations c'est l'écriture. `updateUser(id: "456", input: { role: "admin" })` — même logique, mêmes problèmes.

Côté outils, GraphQL Voyager te permet de visualiser le schéma en graphe, InQL (extension Burp) fait du scan automatique, et graphql-cop détecte les misconfigs.

---

## WebSockets : l'oublié

Les WebSockets, c'est la communication temps réel. Chat, notifications, dashboards live. Et c'est un nid à IDOR parce que personne pense à les tester.

### Pourquoi c'est vulnérable

L'auth est faite au handshake. Le serveur vérifie ton token quand tu te connectes, puis il traite tous tes messages sans re-vérifier. Comme si un videur te checkait à l'entrée du club et qu'après tu pouvais aller dans toutes les salles VIP.

Y'a pas de verbes HTTP non plus. En REST, GET et DELETE sont distincts. En WebSocket, tout est un "message" avec du JSON. C'est plus facile d'oublier les checks quand tout ressemble à tout.

Et le tooling est moins mature. Les proxies et scanners sont moins bons pour WebSocket que pour HTTP. Les devs testent moins, les hunters aussi.

### À quoi ça ressemble

Côté client, tu ouvres une connexion WebSocket avec un token dans l'URL, et tu envoies des messages JSON :

```javascript
const ws = new WebSocket('wss://app.example.com/ws?token=abc123');

ws.send(JSON.stringify({
  type: 'getDocument',
  documentId: 'doc-123'
}));
```

Côté serveur, le code vulnérable ressemble à ça : il vérifie le token au handshake, puis il traite tous les messages sans vérifier que le user a le droit d'accéder au document demandé.

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

### Comment tu testes

Intercepte le trafic WebSocket avec Caido ou Burp — ils le font très bien maintenant. Cherche les messages avec des IDs dedans. Change les IDs. Observe ce qui revient.

Une app de chat par exemple : tu envoies `{ type: 'joinRoom', roomId: 'room-123' }` pour rejoindre ta room, puis tu essaies avec `room-456` qui est la room privée de quelqu'un d'autre. Si ça marche, tu reçois tous leurs messages. Boom.

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

Pour tester, intercepte les requêtes quand tu déclenches l'action depuis le frontend. Tu verras des POST vers des URLs style `/_next/actions/...` avec des payloads JSON. Modifie les IDs dans le payload et regarde ce qui se passe.

---

## L'attaque sandwich sur les UUIDs

"On utilise des UUIDs, c'est impossible à deviner."

C'est vrai pour les UUID v4, qui sont aléatoires. C'est faux pour les UUID v1, qui sont basés sur le temps.

### La différence

Un UUID ressemble à `550e8400-e29b-11d4-a716-446655440000`. Le 13ème caractère te dit la version. Un `1` à cette position, c'est UUID v1 (basé sur le temps). Un `4`, c'est UUID v4 (aléatoire).

### Pourquoi UUID v1 est vulnérable

Un UUID v1 est construit à partir du timestamp, du clock sequence, et de l'adresse MAC de la machine. Le timestamp est encodé dans les trois premiers groupes. Du coup, si deux UUIDs v1 sont générés sur la même machine à des moments proches, leurs timestamps seront proches. Et si tu connais deux UUIDs générés "autour" d'un troisième, tu peux calculer l'intervalle.

### Le scénario classique

Tu veux le lien de reset password d'une victime. Tu demandes un reset pour ton compte et tu récupères l'UUID du lien (UUID1). Ensuite tu demandes un reset pour la victime — elle reçoit un lien avec un UUID que tu connais pas. Puis tu demandes un autre reset pour toi et tu récupères UUID2.

L'UUID de la victime est sandwiché entre UUID1 et UUID2. Si l'intervalle de temps est petit (quelques secondes), l'espace de recherche devient gérable.

L'équipe L&H Security a publié [sandwich](https://github.com/Lupin-Holmes/sandwich) pour automatiser ça. Tu lui files tes deux UUIDs et il génère tous les UUIDs possibles dans l'intervalle.

Évidemment, ça marche que si c'est vraiment des UUID v1, s'ils sont générés sur la même machine, si l'intervalle est petit, s'il y a pas de rate limiting agressif, et si le programme autorise ce type de test. En bug bounty, tu vas rarement bruteforcer en prod — l'objectif c'est surtout de prouver que les UUIDs sont v1 et que l'intervalle est exploitable. Ça suffit souvent pour un rapport.

---

## Multi-tenant : l'isolation fantôme

Les apps SaaS ont des organisations. Chaque org a ses users, ses données, son espace. En théorie. En pratique, l'isolation est souvent une illusion.

Dans une app multi-tenant, t'as généralement un `user_id` pour l'utilisateur, un `org_id` pour l'organisation, et des `resource_id` pour les ressources. Les devs pensent souvent à vérifier le user_id. Ils oublient l'org_id.

### L'attaque

T'as deux comptes dans deux orgs différentes. Compte A dans Org-1, Compte B dans Org-2. Avec le compte A, tu crées une ressource et tu notes son ID. Tu te connectes avec le compte B (autre org). Tu essaies d'accéder à la ressource du compte A.

Si ça marche, t'as une IDOR cross-tenant. C'est généralement critique parce que ça casse l'isolation entre clients.

### Où chercher

Les endpoints d'admin sont souvent moins bien protégés. `/api/admin/users`, `/api/admin/settings`, `/api/admin/billing` — les devs mettent un check "is_admin" mais oublient de vérifier que l'admin appartient à la bonne org.

Les fonctionnalités de partage aussi. "Inviter un user dans l'org", "Partager un document avec une autre org" — ces features traversent volontairement les frontières d'isolation, donc les checks sont plus complexes et souvent incomplets.

---

## Quand lâcher l'affaire

L'IDOR c'est bien, mais faut savoir quand passer à autre chose.

Continue si les IDs sont séquentiels (`user_id=1, 2, 3...`) parce que l'énumération est triviale et y'a forcément des trucs à trouver. Continue si l'app utilise de l'auth maison (JWT custom, sessions bricolées) parce que le code custom a plus de chances d'avoir des trous que les frameworks matures. Continue si les erreurs sont verbeuses — une app qui te dit "User 123 not found" vs "Access denied to user 456" fait son access control au cas par cas, pas de manière systématique. Continue si c'est une app legacy ou une startup early-stage — les vieilles apps ont de la dette technique, les startups ont sacrifié la sécurité pour la vitesse.

Passe à autre chose si c'est UUID v4 partout sans aucun leak — si tu peux pas deviner les IDs, les chances sont faibles. Passe à autre chose si les réponses sont uniformes — une app qui retourne 404 que la ressource existe ou non a été conçue avec la sécurité en tête. Passe à autre chose si le rate limiting est agressif — tu te fais ban après 10 requêtes, ça va être compliqué. Et passe à autre chose si t'as passé 4h sans rien trouver sur une app moderne avec tous les signaux négatifs — le temps c'est de l'argent.

---

## Avant de reporter

T'as testé sur TES ressources d'abord ? Tu devrais jamais supprimer ou modifier les données d'autres users. T'as des preuves reproductibles ? Des requêtes curl, des screenshots, pas juste "j'ai vu un truc". T'as vérifié que c'est pas un comportement attendu ? Des profils publics, des données partagées volontairement, ça existe. T'as cherché l'escalade ? Une IDOR de lecture c'est bien, une IDOR de lecture qui mène à une IDOR d'écriture qui mène à un account takeover, c'est mieux. Ton rapport explique l'impact business ? "Je peux lire les documents des autres users" c'est technique, "Un attaquant peut accéder aux contrats confidentiels de n'importe quel client" c'est business.

---

## Ressources

Si t'as lu jusqu'ici et que t'en veux encore : [PortSwigger Academy](https://portswigger.net/web-security/access-control) pour des labs pratiques, [l'article de L&H Security](https://www.landh.tech/blog/20230811-sandwich-attack/) sur l'attaque sandwich, [HackTricks](https://book.hacktricks.wiki/en/pentesting-web/idor.html) comme référence technique, et [Autorize](https://github.com/caido-community/autorize) dont on a parlé en partie 2.

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
