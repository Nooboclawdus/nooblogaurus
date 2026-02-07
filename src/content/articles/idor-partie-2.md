# IDOR : Les conneries à éviter

*Autorize pour aller vite, et les 6 erreurs qui te font perdre du temps.*

> [!TIP]
> **Cet article est en 3 parties :**
> - [Partie 1](/articles/idor-partie-1) — La méthode qui marche
> - **Partie 2** (tu es ici) — Les conneries à éviter
> - [Partie 3](/articles/idor-partie-3) — Les trucs que presque personne explique

---

## Automatiser avec Autorize (Caido)

Faire le test 2-comptes manuellement, ça marche. Mais c'est lent. Sur une application avec 200 endpoints, tu vas y passer la journée. C'est là qu'Autorize entre en jeu.

### Ce que fait Autorize

[Autorize](https://github.com/caido-community/autorize) est le plugin officiel de Caido pour automatiser les tests d'autorisation. Son principe est simple : pour chaque requête qui passe par ton proxy, il la rejoue automatiquement avec différents niveaux de privilèges et compare les réponses.

Concrètement, quand tu navigues avec ton compte high-privilege, Autorize génère en parallèle :

- **Baseline** : la requête originale (ton compte high-priv)
- **Mutated** : la même requête avec les credentials d'un compte low-priv
- **No-Auth** : la même requête sans aucune authentification

En comparant les réponses, il détecte automatiquement les cas où un utilisateur moins privilégié (ou pas authentifié du tout) peut accéder aux mêmes ressources.

> [!INFO]
> **Burp users** : Autorize existe aussi pour Burp Suite (extension populaire). La config est similaire — le concept reste le même.

### Configuration étape par étape

**Étape 1 : Installer le plugin**

Dans Caido, va dans l'interface des plugins et installe Autorize depuis l'onglet Official. C'est le plugin maintenu par l'équipe Caido.

**Étape 2 : Récupérer le token du compte low-priv**

Connecte-toi avec ton compte low-privilege (l'équivalent du compte B dans notre méthodo manuelle). Dans ton proxy, trouve la requête d'authentification et copie le token ou cookie de session.

Par exemple, si l'app utilise un header `Authorization: Bearer xxx`, copie la valeur `xxx`. Si c'est un cookie de session, copie la valeur du cookie.

**Étape 3 : Configurer la mutation**

Dans l'interface Autorize, va dans Configuration → Mutations → Mutated.

Ajoute une mutation de type "Header: Set" :
- Header name : `Authorization`
- Value : `Bearer [le token de ton compte low-priv]`

Si l'app utilise des cookies plutôt qu'un header Authorization, utilise une mutation "Cookie: Set" à la place.

**Ce que ça fait** : chaque requête sera rejouée avec ce token à la place du token original.

**Étape 4 : Configurer le No-Auth (optionnel)**

Par défaut, Autorize retire automatiquement les headers `Authorization` et `Cookie` pour la requête No-Auth. Si ton app utilise un mécanisme d'auth custom (header `X-Auth-Token` par exemple), tu peux ajouter une mutation pour le retirer explicitement.

**Étape 5 : Filtrer le bruit**

Une application web génère beaucoup de requêtes : assets statiques (JS, CSS, images), requêtes analytics, health checks... Tu veux pas qu'Autorize teste tout ça.

Dans Configuration → Filtering, tu peux :
- Appliquer un scope preset (si tu en as défini un pour ta cible)
- Utiliser une requête HTTPQL pour filtrer

Exemple de filtre HTTPQL pour ne tester que les endpoints API :

```
req.path:/api/ AND NOT req.path.ext:(js OR css OR png OR jpg)
```

**Étape 6 : Activer le scan passif**

Clique sur "Enable Passive Scanning" en haut à droite de l'interface Autorize.

**Étape 7 : Naviguer avec le compte high-priv**

Maintenant, déconnecte-toi du compte low-priv et connecte-toi avec le compte high-privilege (l'équivalent du compte A). Navigue normalement dans l'application, utilise toutes les fonctionnalités.

En arrière-plan, Autorize intercepte chaque requête et la teste automatiquement avec les credentials low-priv et sans auth.

### Interpréter les résultats

Dans l'onglet Dashboard d'Autorize, tu vois les résultats de chaque test :

**ALLOW (rouge/orange)** — La requête a réussi avec les credentials low-priv ou sans auth. C'est potentiellement une IDOR.

Mais attention : "ALLOW" ne veut pas automatiquement dire "vulnérable". Vérifie que :
- La ressource accédée appartient bien au compte high-priv, pas au low-priv
- Les données retournées sont bien sensibles
- Ce n'est pas un endpoint intentionnellement public

**DENY (vert)** — La requête a été refusée (401, 403, 404). L'access control fonctionne.

**UNCERTAIN (jaune)** — La réponse est différente du baseline mais pas clairement un refus. Peut-être une erreur applicative, une réponse partielle, ou un cas edge. À investiguer manuellement.

### Les cas edge qui font buguer Autorize

**Tokens qui expirent**

Si le token de ton compte low-priv expire pendant le scan, toutes les requêtes vont retourner 401 et Autorize va marquer tout comme DENY. Tu vas croire que l'app est sécurisée alors que t'as juste un token expiré.

**Solution** : utilise un token avec une longue durée de vie, ou configure un workflow Caido pour rafraîchir automatiquement le token (voir la [doc sur les refresh auth workflows](https://docs.caido.io/tutorials/refresh_authentication)).

**Apps avec CSRF tokens**

Certaines apps incluent un token CSRF dans chaque requête. Si ce token est lié à la session, la requête mutée va échouer à cause d'un CSRF mismatch, pas à cause de l'access control.

**Solution** : configure une mutation supplémentaire pour remplacer ou retirer le token CSRF, ou désactive la protection CSRF temporairement côté serveur si t'as accès (en environnement de test uniquement).

**Multiples cookies de session**

Certaines apps utilisent plusieurs cookies en combinaison. Si tu remplaces seulement `session_id` mais que l'app vérifie aussi `user_token`, la requête va échouer.

**Solution** : analyse les cookies utilisés par l'app et configure des mutations pour tous les remplacer.

**Réponses dynamiques**

Si l'app retourne des réponses avec des timestamps, des nonces, ou des données qui changent à chaque requête, Autorize peut avoir du mal à comparer baseline et mutated.

**Solution** : utilise les options de détection custom dans Configuration → Detection pour définir ce qui constitue une réponse autorisée vs refusée pour ton app spécifique.

---

## Les 6 erreurs qui te font perdre du temps

Après avoir analysé pas mal de rapports (les miens et ceux des autres), voici les patterns de perte de temps récurrents. Pour chaque erreur, je t'explique pourquoi ça arrive, comment la détecter, et comment l'éviter.

### Erreur 1 : Tester que les IDs évidents

**Le problème**

Tu vois `?id=123` dans l'URL, tu le changes en `?id=124`, tu testes, tu passes au suivant. Classique. Mais les IDs ne sont pas que dans les URLs.

Les développeurs mettent des IDs partout, et souvent dans des endroits moins évidents :

**Dans le body des requêtes POST/PUT** :
```json
{
  "action": "update",
  "userId": 123,
  "targetId": 456,
  "documentId": "abc-123"
}
```

Ici, y'a potentiellement 3 IDs à tester : `userId`, `targetId`, et `documentId`. Le `userId` peut être ton propre ID (pour éviter que tu modifies ton propre compte via un autre), mais `targetId` et `documentId` pointent peut-être vers des ressources d'autres users.

**Dans les headers HTTP** :
```http
GET /api/dashboard HTTP/2
Host: app.example.com
Authorization: Bearer eyJ...
X-User-ID: 123
X-Account-ID: 456
X-Workspace-ID: 789
```

Ces headers custom sont souvent ajoutés par le frontend et le backend leur fait confiance aveuglément. Le `X-User-ID` peut overrider l'ID extrait du token JWT.

**Encodés en base64 ou autre** :
```
/api/documents?ref=eyJ1c2VySWQiOjEyMywiZG9jSWQiOiJhYmMtMTIzIn0=
```

Ça ressemble à un token opaque, mais c'est juste du JSON en base64 :
```json
{"userId":123,"docId":"abc-123"}
```

Décode, modifie, réencode, envoie.

**Dans les cookies** :
```
Cookie: session=abc123; user_context=eyJ1aWQiOjEyM30=
```

Le `user_context` est souvent un JSON encodé avec des IDs dedans.

**Dans les paths d'URL** :
```
/users/123/documents/456/comments/789
```

Y'a trois IDs dans ce path. Souvent on teste le dernier (789) mais pas les premiers.

**Comment l'éviter**

1. Utilise la fonction Search de ton proxy pour chercher où ton user_id apparaît dans TOUTES les requêtes capturées
2. Décode systématiquement tout ce qui ressemble à du base64
3. Inspecte les headers custom (tout ce qui commence par `X-`)
4. Parse les cookies à la recherche de valeurs structurées

### Erreur 2 : S'arrêter au premier 403

**Le problème**

Tu testes un endpoint :
```http
GET /api/users/456 HTTP/2
→ 403 Forbidden
```

Tu te dis "c'est protégé, next". Erreur.

Les développeurs implémentent souvent l'access control de manière incohérente. Ils pensent à protéger les opérations les plus évidentes mais oublient les autres.

**Scénario typique** :

Le dev se dit "je dois protéger l'accès aux profils utilisateurs". Il ajoute un check sur `GET /api/users/:id`. Mission accomplie, il passe à autre chose.

Mais l'app a aussi :
- `PUT /api/users/:id` pour modifier
- `DELETE /api/users/:id` pour supprimer
- `PATCH /api/users/:id` pour mise à jour partielle

Et ces endpoints ? Pas de check. Parce que "si on peut pas lire, pourquoi on pourrait modifier ?" Sauf que c'est pas comme ça que HTTP fonctionne.

**Exemple concret** :

D'abord, tu identifies les endpoints sur TES propres ressources (ton propre document) :

```http
DELETE /api/documents/doc-AAA HTTP/2
→ 200 OK {"deleted": true}
```

Ensuite, tu testes l'accès sur une ressource d'un autre user :
```http
GET /api/documents/doc-BBB HTTP/2
→ 403 Forbidden
```

Maintenant tu veux vérifier si DELETE bypass le contrôle, **sans transformer un test en suppression réelle**. L'idée, c'est pas "avoir un 200", c'est "montrer que ça ne bloque pas côté autorisation".

Quelques façons propres (selon appli) :

- **Option 1 (signal, pas preuve)** : `OPTIONS` / `Allow` peuvent te donner une piste, mais ça reste souvent générique. Utile pour orienter, pas suffisant tout seul.

- **Option 2 (preuve sans dégâts)** : faire échouer la requête *après* l'authz. Par exemple une précondition (`If-Match`) qui provoque un `412`, ou une validation qui provoque un `400`. Si tu obtiens ce genre de réponse au lieu d'un `403`, t'as un argument fort que l'endpoint est atteignable sans blocage d'accès.

- **Option 3 (blind, mais clean)** : tu montres l'incohérence par pattern (GET bloqué, DELETE non bloqué sur TES ressources, routes CRUD asymétriques, etc.), puis tu demandes au triage si un test destructif contrôlé est autorisé. Certains programmes acceptent, d'autres non.

Le point clé : tu constates que le contrôle d'accès est incohérent entre les méthodes HTTP. Tu n'as pas besoin de supprimer le document de quelqu'un d'autre pour prouver le problème.

**Pourquoi ça arrive**

Plusieurs raisons :
1. Le check d'autorisation est fait dans le controller de GET mais pas dans les autres
2. Le dev utilise un middleware d'auth qui ne couvre que certaines routes
3. Les routes PUT/DELETE ont été ajoutées plus tard et personne n'a pensé à l'access control
4. Le framework génère automatiquement des routes CRUD et le dev n'a sécurisé que celles qu'il a explicitement codées

**Comment tester proprement**

Pour CHAQUE endpoint protégé, vérifie l'accessibilité des différents verbes HTTP :
- GET (lecture) — test direct, safe
- POST (création) — teste sur ton propre compte
- PUT (remplacement) — teste d'abord sur tes ressources
- PATCH (mise à jour partielle) — teste d'abord sur tes ressources
- DELETE (suppression) — **teste sur TES ressources uniquement**, puis prouve l'absence de check d'accès sans déclencher l'effet
- HEAD (comme GET mais sans body) — safe, peut révéler des différences de traitement
- OPTIONS (peut leaker des infos sur les méthodes supportées) — safe et utile, mais attention aux faux signaux

**Astuce** : `Allow: GET, DELETE` sur une ressource "pas à toi" peut être un bon indicateur, mais la vraie preuve c'est quand tu vois que le serveur ne te refuse pas l'accès (pas de 403) et te renvoie une réponse de logique métier.

Y'a aussi les headers de method override qui peuvent bypass des protections :
```http
POST /api/users/456 HTTP/2
X-HTTP-Method-Override: DELETE
```

Certains frameworks (notamment en Java/Spring) interprètent ce header et transforment le POST en DELETE côté serveur. Si le WAF ou le middleware d'auth ne check que la méthode HTTP apparente, le DELETE passe.

### Erreur 3 : Ignorer les réponses "identiques"

**Le problème**

Tu testes :
```http
POST /api/notifications/send HTTP/2
{"to": "456", "message": "test"}
→ 200 OK {"status": "sent", "id": "notif-789"}
```

Tu fais le même test avec ton propre ID :
```http
POST /api/notifications/send HTTP/2
{"to": "123", "message": "test"}
→ 200 OK {"status": "sent", "id": "notif-790"}
```

Les deux réponses sont similaires. Tu passes au suivant. Erreur.

**Ce qui s'est peut-être passé**

L'utilisateur 456 vient de recevoir une notification de ta part. L'action s'est exécutée côté serveur, même si la réponse ne te donne pas de détails sur le destinataire.

C'est ce qu'on appelle une **IDOR blind** : tu ne vois pas directement les données de l'autre user, mais tu peux effectuer des actions sur ses ressources.

**Exemples d'IDOR blind** :

- **Envoi d'emails/notifs** : tu déclenches l'envoi à quelqu'un d'autre (teste avec tes propres comptes A et B)
- **Modification de préférences** : tu changes les settings d'un autre user sans voir le résultat
- **Abonnement/désabonnement** : tu changes les subscriptions d'un autre user
- **Consommation de quotas** : tu épuises les crédits/quotas d'un autre compte

**Note importante** : pour les IDOR blind, teste idéalement entre tes deux comptes (A et B). Tu fais l'action depuis B ciblant A, puis tu vérifies côté A si quelque chose a changé. Comme ça tu prouves la vuln sans impacter de vrais utilisateurs.

**Comment détecter**

1. **Vérifie les side-effects** : après ton test, connecte-toi avec le compte cible et vérifie si quelque chose a changé
2. **Check les emails** : si l'app envoie des emails, le compte cible en a peut-être reçu un
3. **Compare les états** : fais un GET sur la ressource avant et après ton action pour voir si elle a changé
4. **Monitore les logs** : si t'as accès aux logs serveur (en environnement de test), vérifie ce qui s'est passé

**Comment l'éviter**

Crée un workflow systématique :
1. Note l'état initial de la ressource cible (depuis le compte A)
2. Effectue l'action depuis le compte B
3. Re-vérifie l'état de la ressource (depuis le compte A)
4. Compare avant/après

### Erreur 4 : Reporter trop vite

> [!NOTE]
> **C'est l'erreur qui coûte le plus cher en bounty.** Tu trouves une IDOR, tu soumets vite, et tu passes à côté de l'escalade qui aurait multiplié le payout par 5.

**Le problème**

Tu trouves que tu peux lire le profil de quelqu'un d'autre. Victoire ! Tu rédiges un rapport de 3 paragraphes et tu soumets.

Réponse du programme : "Info disclosure, Low, duplicate".

**Ce qui s'est passé**

Tu as reporté le symptôme, pas l'impact maximal. En t'arrêtant à la première IDOR trouvée, tu as peut-être raté :
- Une IDOR de modification sur le même endpoint
- Une escalade vers des données plus sensibles
- Une chaîne d'exploitation avec d'autres vulns

**La hiérarchie des impacts**

Pas toutes les IDOR se valent. Voici la progression typique (de faible à critique) :

```
Lecture de données peu sensibles (username, avatar)
    ↓
Lecture de données sensibles (email, téléphone)
    ↓
Lecture de données critiques (documents privés, credentials)
    ↓
Modification de données non critiques
    ↓
Modification de données critiques
    ↓
Endpoint de suppression accessible (sans exécuter)
    ↓
Modification des permissions/rôles
    ↓
Account takeover complet
```

**Avant de reporter, explore l'escalade** :

1. **Read → Write** : si tu peux lire avec `GET /api/resource/123`, l'endpoint `PUT /api/resource/123` est-il accessible ? Teste d'abord sur tes propres ressources pour voir le comportement normal.

2. **User → Admin** : tu as accès aux données d'un user lambda. Peux-tu accéder aux données d'un admin ? Cherche des IDs de comptes admin (souvent les premiers créés : 1, 2, 3) ou des endpoints spécifiques (`/api/admin/users`).

3. **Données → Actions** : tu vois des données. Peux-tu les utiliser pour autre chose ? Par exemple, si tu leaks un reset token, tu peux prendre le contrôle du compte.

4. **Single → Mass** : tu accèdes à une ressource. Peux-tu raisonnablement estimer l'échelle ? Teste 3-5 IDs pour confirmer le pattern, pas 10 000.

**L'art du chaînage**

Parfois, une IDOR seule a un impact faible, mais combinée avec une autre vuln, ça devient critique.

Exemple :
- IDOR : tu peux lire les profils des autres users → faible
- Dans le profil, y'a l'email → toujours faible
- L'app permet de reset le password par email → normal
- Le lien de reset est prévisible (UUID v1) → maintenant on parle

IDOR seule : Low. Chaîne complète : Account Takeover → Critical.

### Erreur 5 : Oublier le multi-tenant

**Le problème**

Tu testes une app SaaS. Tu as ton compte dans l'organisation "MonOrg". Tu changes des IDs utilisateurs, tu trouves rien. Tu passes à autre chose.

Tu as oublié de tester l'isolation entre organisations.

**Comment fonctionne le multi-tenant**

Les apps SaaS ont généralement plusieurs niveaux d'isolation :

```
Plateforme
├── Organisation A
│   ├── User 1
│   └── User 2
└── Organisation B
    ├── User 3
    └── User 4
```

Les users 1 et 2 sont dans la même org, ils peuvent peut-être voir leurs données mutuelles (selon les permissions). Mais ils ne devraient JAMAIS voir les données de l'org B.

**Où chercher le tenant ID**

Les développeurs stockent l'ID d'organisation dans plein d'endroits :

**Dans l'URL** :
```
/api/org/42/users
/api/workspaces/42/documents
/v1/tenants/42/settings
```

**Dans les headers** :
```http
X-Tenant-ID: 42
X-Organization-ID: 42
X-Workspace-ID: 42
```

**Dans le body** :
```json
{
  "orgId": 42,
  "action": "list_users"
}
```

**Dans les cookies** :
```
Cookie: session=abc; tenant=42
```

**Dans les sous-domaines** :
```
org-42.app.example.com
monorg.app.example.com
```

**Dans le JWT** (si tu peux le modifier ou si le serveur ne le valide pas correctement) :
```json
{
  "sub": "user-123",
  "org_id": 42,
  "role": "member"
}
```

**Les scénarios à tester**

1. **Cross-org data access** (lecture) : user de l'org A accède aux données de l'org B

Tu es dans l'org 42, tu testes l'accès à l'org 43 :

```http
GET /api/org/43/users HTTP/2
→ 200 OK [liste des users de l'org 43]
```
C'est le test le plus safe et souvent suffisant pour prouver le problème d'isolation.

2. **Cross-org endpoint access** (vérification sans exécution) : vérifie si les endpoints sensibles sont atteignables

Même logique que plus haut : `OPTIONS`/`HEAD` c'est des signaux. La preuve la plus propre, c'est de montrer que tu n'es pas refusé côté authz et que tu touches une réponse "métier" (même si elle échoue ensuite pour une autre raison).

Exemple :
```http
OPTIONS /api/org/43/users/789 HTTP/2
→ 200 OK
Allow: GET, PUT, DELETE
```
Ça peut être intéressant, mais ne le vends pas comme "preuve finale" si c'est le seul élément.

3. **Org switching** : manipuler son propre profil pour changer d'org
```http
PUT /api/me HTTP/2
{"org_id": 43}
→ 200 OK  # Tu es maintenant dans l'org 43 ?
```
Si ça marche, vérifie en faisant un GET sur ton profil — tu as changé d'org sans y être invité.

**Pourquoi c'est souvent vulnérable**

Le multi-tenant est compliqué à implémenter correctement. Les devs doivent :
- Vérifier l'appartenance à l'org sur CHAQUE requête
- S'assurer que les queries DB sont toujours filtrées par org_id
- Gérer les cas edge (users appartenant à plusieurs orgs, migration d'orgs, etc.)

Souvent, ils implémentent le check au niveau de l'authentification ("ce user existe-t-il dans cette org ?") mais oublient le check au niveau de l'autorisation ("ce user a-t-il le droit d'accéder à CETTE ressource dans CETTE org ?").

### Erreur 6 : Bruteforcer comme un bourrin

**Le problème**

Tu trouves une IDOR sur `GET /api/users/{id}`. Tu te dis "je vais énumérer tous les users" et tu lances :

```python
for i in range(1, 1000000):
    requests.get(f"https://target.com/api/users/{i}")
```

Résultat :
- Tu te fais rate-limit au bout de 100 requêtes
- Ton IP se fait ban
- L'équipe sécu reçoit une alerte et ton compte est suspendu
- Ton rapport est rejeté pour "testing excessif"

**Pourquoi c'est une mauvaise idée**

1. **C'est pas nécessaire pour prouver la vuln** : si tu accèdes à 5 ressources qui ne t'appartiennent pas, t'as prouvé l'IDOR. Pas besoin d'en récupérer 10 000.

2. **C'est hors scope** : la plupart des programmes interdisent l'extraction massive de données, même via une vuln légitime.

3. **C'est détectable** : les équipes sécu ont des alertes sur les patterns d'énumération. Tu vas te faire repérer.

4. **C'est potentiellement illégal** : selon la juridiction, extraire des données en masse peut être considéré différemment d'un simple test de sécurité.

**La bonne approche**

1. **Test manuel d'abord** : vérifie que l'IDOR existe sur 3-5 IDs différents, manuellement, à des intervalles normaux.

2. **Documente le pattern** : "Les IDs sont séquentiels de 1 à N. J'ai vérifié que les IDs 100, 101, 102 (qui ne m'appartiennent pas) sont accessibles. Le même pattern s'applique vraisemblablement à tous les IDs."

3. **Estime l'échelle** : si t'as accès à un endpoint qui liste le nombre total d'objets ou le dernier ID créé, mentionne-le. "Le dernier document créé a l'ID 847293, suggérant que ~850K documents sont potentiellement exposés."

4. **Si tu dois vraiment énumérer** (par exemple pour prouver un impact sur un programme qui le demande) :
   - Fais-le lentement (1 requête par seconde max)
   - Utilise un échantillon représentatif (tous les 100 IDs par exemple)
   - Limite-toi à quelques centaines de requêtes
   - Préviens le programme avant si possible

---



---

> [!INFO]
> **Navigation :**
> - [← Partie 1 : Les fondamentaux](/articles/idor-partie-1)
> - [Partie 3 : Techniques avancées →](/articles/idor-partie-3)
