# IDOR : Les conneries à éviter

*Autorize pour aller vite, et les erreurs classiques qui te font perdre du temps.*

> [!TIP]
> **Cet article est en 3 parties :**
> - [Partie 1](/articles/idor-partie-1) — La méthode qui marche
> - **Partie 2** (tu es ici) — Les conneries à éviter
> - [Partie 3](/articles/idor-partie-3) — Les trucs que presque personne explique

---

## Automatiser avec Autorize

Faire le test 2-comptes manuellement, ça marche. Mais c'est lent. Sur une application avec 200 endpoints, tu vas y passer la journée. C'est là qu'[Autorize](https://github.com/caido-community/autorize) entre en jeu.

Autorize c'est le plugin officiel de Caido pour automatiser les tests d'autorisation. Son principe est simple : pour chaque requête qui passe par ton proxy, il la rejoue automatiquement avec différents niveaux de privilèges et compare les réponses. Concrètement, quand tu navigues avec ton compte high-privilege, Autorize génère en parallèle trois versions de chaque requête. La baseline c'est la requête originale avec ton compte high-priv. La mutated c'est la même requête avec les credentials d'un compte low-priv. La no-auth c'est la même requête sans aucune authentification. En comparant les réponses, il détecte automatiquement les cas où un utilisateur moins privilégié peut accéder aux mêmes ressources.

> [!INFO]
> Autorize existe aussi pour Burp Suite (extension populaire). La config est similaire — le concept reste le même.

### Configuration

Dans Caido, installe Autorize depuis l'interface des plugins, onglet Official. Ensuite connecte-toi avec ton compte low-privilege (l'équivalent du compte B) et récupère le token ou cookie de session dans ton proxy. Si l'app utilise un header `Authorization: Bearer xxx`, copie la valeur xxx. Si c'est un cookie de session, copie la valeur du cookie.

Dans l'interface Autorize, va dans Configuration puis Mutations puis Mutated. Ajoute une mutation de type "Header: Set" avec le header name `Authorization` et la value `Bearer [ton token low-priv]`. Si l'app utilise des cookies plutôt qu'un header Authorization, utilise une mutation "Cookie: Set" à la place. Ce que ça fait : chaque requête sera rejouée avec ce token à la place du token original.

Pour le No-Auth, Autorize retire automatiquement les headers Authorization et Cookie par défaut. Si ton app utilise un mécanisme d'auth custom comme un header `X-Auth-Token`, tu peux ajouter une mutation pour le retirer explicitement.

Une application web génère beaucoup de bruit — assets statiques, requêtes analytics, health checks. Tu veux pas qu'Autorize teste tout ça. Dans Configuration puis Filtering, tu peux appliquer un scope preset ou utiliser une requête HTTPQL pour filtrer. Par exemple `req.path:/api/ AND NOT req.path.ext:(js OR css OR png OR jpg)` pour ne tester que les endpoints API.

Clique sur "Enable Passive Scanning" en haut à droite, déconnecte-toi du compte low-priv, connecte-toi avec le compte high-privilege, et navigue normalement dans l'application. En arrière-plan, Autorize intercepte chaque requête et la teste automatiquement.

### Interpréter les résultats

Dans l'onglet Dashboard d'Autorize, les résultats en rouge ou orange marqués ALLOW indiquent que la requête a réussi avec les credentials low-priv ou sans auth — c'est potentiellement une IDOR. Mais attention, ALLOW ne veut pas automatiquement dire vulnérable. Vérifie que la ressource accédée appartient bien au compte high-priv et pas au low-priv, que les données retournées sont bien sensibles, et que c'est pas un endpoint intentionnellement public.

Les résultats en vert marqués DENY indiquent que la requête a été refusée avec un 401, 403 ou 404. L'access control fonctionne.

Les résultats en jaune marqués UNCERTAIN indiquent que la réponse est différente du baseline mais pas clairement un refus. Peut-être une erreur applicative, une réponse partielle, ou un cas edge. À investiguer manuellement.

<!-- DIAGRAM:autorize -->

### Les pièges

Si le token de ton compte low-priv expire pendant le scan, toutes les requêtes vont retourner 401 et Autorize va marquer tout comme DENY. Tu vas croire que l'app est sécurisée alors que t'as juste un token expiré. Utilise un token avec une longue durée de vie, ou configure un workflow Caido pour rafraîchir automatiquement le token.

Certaines apps incluent un token CSRF dans chaque requête. Si ce token est lié à la session, la requête mutée va échouer à cause d'un CSRF mismatch, pas à cause de l'access control. Configure une mutation supplémentaire pour remplacer ou retirer le token CSRF.

D'autres apps utilisent plusieurs cookies en combinaison. Si tu remplaces seulement `session_id` mais que l'app vérifie aussi `user_token`, la requête va échouer. Analyse les cookies utilisés et configure des mutations pour tous les remplacer.

Si l'app retourne des réponses avec des timestamps ou des nonces qui changent à chaque requête, Autorize peut avoir du mal à comparer baseline et mutated. Utilise les options de détection custom dans Configuration puis Detection pour définir ce qui constitue une réponse autorisée vs refusée pour ton app.

---

## Tester que les IDs évidents

Tu vois `?id=123` dans l'URL, tu le changes en `?id=124`, tu testes, tu passes au suivant. Classique. Mais les IDs ne sont pas que dans les URLs.

Les développeurs mettent des IDs partout. Dans le body des requêtes POST et PUT, tu peux avoir trois IDs à tester dans le même JSON : userId, targetId, documentId. Le userId peut être ton propre ID, mais targetId et documentId pointent peut-être vers des ressources d'autres users.

```json
{
  "action": "update",
  "userId": 123,
  "targetId": 456,
  "documentId": "abc-123"
}
```

Dans les headers HTTP, les headers custom comme `X-User-ID`, `X-Account-ID`, `X-Workspace-ID` sont souvent ajoutés par le frontend et le backend leur fait confiance aveuglément. Le X-User-ID peut overrider l'ID extrait du token JWT.

Encodés en base64, ça ressemble à un token opaque mais c'est souvent juste du JSON. `/api/documents?ref=eyJ1c2VySWQiOjEyMywiZG9jSWQiOiJhYmMtMTIzIn0=` décode en `{"userId":123,"docId":"abc-123"}`. Décode, modifie, réencode, envoie.

Dans les cookies aussi. Le `user_context` est souvent un JSON encodé avec des IDs dedans. Et dans les paths d'URL comme `/users/123/documents/456/comments/789`, y'a trois IDs. Souvent on teste le dernier mais pas les premiers.

Utilise la fonction Search de ton proxy pour chercher où ton user_id apparaît dans TOUTES les requêtes capturées. Décode systématiquement tout ce qui ressemble à du base64. Inspecte les headers custom, tout ce qui commence par X-. Parse les cookies à la recherche de valeurs structurées.

---

## S'arrêter au premier 403

Tu testes un endpoint, tu reçois un 403 Forbidden, tu te dis "c'est protégé, next". Erreur.

Les développeurs implémentent souvent l'access control de manière incohérente. Le dev se dit "je dois protéger l'accès aux profils utilisateurs", il ajoute un check sur `GET /api/users/:id`, mission accomplie, il passe à autre chose. Mais l'app a aussi `PUT /api/users/:id` pour modifier, `DELETE /api/users/:id` pour supprimer, `PATCH /api/users/:id` pour mise à jour partielle. Et ces endpoints ? Pas de check. Parce que "si on peut pas lire, pourquoi on pourrait modifier ?" Sauf que c'est pas comme ça que HTTP fonctionne.

D'abord tu identifies les endpoints sur TES propres ressources. Tu fais un DELETE sur ton propre document, tu vois que ça retourne 200 OK. Ensuite tu testes l'accès sur une ressource d'un autre user, le GET retourne 403 Forbidden. Maintenant tu veux vérifier si DELETE bypass le contrôle, sans transformer un test en suppression réelle.

L'idée c'est pas d'avoir un 200, c'est de montrer que ça ne bloque pas côté autorisation. Tu peux faire échouer la requête après l'authz en utilisant une précondition `If-Match` qui provoque un 412, ou une validation qui provoque un 400. Si tu obtiens ce genre de réponse au lieu d'un 403, t'as un argument fort que l'endpoint est atteignable sans blocage d'accès. Tu peux aussi montrer l'incohérence par pattern — GET bloqué mais DELETE non bloqué sur TES ressources, routes CRUD asymétriques — puis demander au triage si un test destructif contrôlé est autorisé.

Pour chaque endpoint protégé, vérifie l'accessibilité des différents verbes HTTP. GET pour la lecture c'est un test direct et safe. POST, PUT, PATCH tu testes d'abord sur tes ressources. DELETE tu testes sur TES ressources uniquement, puis tu prouves l'absence de check d'accès sans déclencher l'effet. HEAD peut révéler des différences de traitement. OPTIONS peut leaker des infos sur les méthodes supportées.

Y'a aussi les headers de method override qui peuvent bypass des protections. `X-HTTP-Method-Override: DELETE` sur un POST, certains frameworks comme Spring interprètent ce header et transforment le POST en DELETE côté serveur. Si le WAF ou le middleware d'auth ne check que la méthode HTTP apparente, le DELETE passe.

---

## Ignorer les réponses identiques

Tu testes un endpoint d'envoi de notification avec un ID qui n'est pas le tien, tu reçois 200 OK avec `{"status": "sent"}`. Tu fais le même test avec ton propre ID, tu reçois 200 OK avec `{"status": "sent"}`. Les deux réponses sont similaires, tu passes au suivant. Erreur.

L'utilisateur cible vient peut-être de recevoir une notification de ta part. L'action s'est exécutée côté serveur, même si la réponse ne te donne pas de détails sur le destinataire. C'est ce qu'on appelle une IDOR blind : tu ne vois pas directement les données de l'autre user, mais tu peux effectuer des actions sur ses ressources.

Ça peut être l'envoi d'emails ou de notifications, la modification de préférences sans voir le résultat, l'abonnement ou le désabonnement de quelqu'un, la consommation des crédits ou quotas d'un autre compte.

Pour les IDOR blind, teste idéalement entre tes deux comptes A et B. Tu fais l'action depuis B ciblant A, puis tu vérifies côté A si quelque chose a changé. Comme ça tu prouves la vuln sans impacter de vrais utilisateurs.

Après ton test, connecte-toi avec le compte cible et vérifie si quelque chose a changé. Check les emails si l'app en envoie. Compare les états avant et après en faisant un GET sur la ressource. Si t'as accès aux logs serveur en environnement de test, vérifie ce qui s'est passé.

---

## Reporter trop vite

> [!NOTE]
> C'est l'erreur qui coûte le plus cher en bounty. Tu trouves une IDOR, tu soumets vite, et tu passes à côté de l'escalade qui aurait multiplié le payout par 5.

Tu trouves que tu peux lire le profil de quelqu'un d'autre. Victoire. Tu rédiges un rapport de 3 paragraphes et tu soumets. Réponse du programme : "Info disclosure, Low, duplicate".

Tu as reporté le symptôme, pas l'impact maximal. En t'arrêtant à la première IDOR trouvée, tu as peut-être raté une IDOR de modification sur le même endpoint, une escalade vers des données plus sensibles, une chaîne d'exploitation avec d'autres vulns.

<!-- DIAGRAM:impact -->

Pas toutes les IDOR se valent. La lecture de données peu sensibles comme le username ou l'avatar c'est faible. La lecture de données sensibles comme l'email ou le téléphone c'est un peu mieux. La lecture de données critiques comme des documents privés ou des credentials c'est déjà sérieux. La modification de données c'est encore mieux. La modification des permissions ou des rôles c'est critique. L'account takeover complet c'est le jackpot.

Avant de reporter, explore l'escalade. Si tu peux lire avec GET, l'endpoint PUT est-il accessible ? Tu as accès aux données d'un user lambda, peux-tu accéder aux données d'un admin ? Cherche des IDs de comptes admin qui sont souvent les premiers créés (1, 2, 3) ou des endpoints spécifiques comme `/api/admin/users`. Tu vois des données, peux-tu les utiliser pour autre chose ? Si tu leaks un reset token, tu peux prendre le contrôle du compte.

Parfois une IDOR seule a un impact faible, mais combinée avec une autre vuln ça devient critique. Tu peux lire les profils des autres users, c'est faible. Dans le profil y'a l'email, toujours faible. L'app permet de reset le password par email, c'est normal. Le lien de reset est prévisible avec des UUID v1, maintenant on parle. IDOR seule c'est Low. Chaîne complète c'est Account Takeover, Critical.

---

## Oublier le multi-tenant

Tu testes une app SaaS, tu as ton compte dans l'organisation MonOrg. Tu changes des IDs utilisateurs, tu trouves rien, tu passes à autre chose. Tu as oublié de tester l'isolation entre organisations.

<!-- DIAGRAM:multitenant -->

Les apps SaaS ont généralement plusieurs niveaux d'isolation. La plateforme contient des organisations, chaque organisation contient des users. Les users dans la même org peuvent peut-être voir leurs données mutuelles selon les permissions. Mais ils ne devraient JAMAIS voir les données d'une autre org.

Les développeurs stockent l'ID d'organisation dans plein d'endroits. Dans l'URL comme `/api/org/42/users`. Dans les headers comme `X-Tenant-ID` ou `X-Organization-ID`. Dans le body JSON. Dans les cookies. Dans les sous-domaines comme `org-42.app.example.com`. Dans le JWT si tu peux le modifier ou si le serveur ne le valide pas correctement.

Le test le plus safe et souvent suffisant pour prouver le problème d'isolation c'est le cross-org data access en lecture. Tu es dans l'org 42, tu testes l'accès à l'org 43 avec `GET /api/org/43/users`. Si tu reçois la liste des users de l'org 43, t'as trouvé.

Tu peux aussi essayer l'org switching en manipulant ton propre profil avec `PUT /api/me` et `{"org_id": 43}`. Si ça marche, vérifie en faisant un GET sur ton profil — tu as changé d'org sans y être invité.

Le multi-tenant est compliqué à implémenter correctement. Les devs doivent vérifier l'appartenance à l'org sur chaque requête et s'assurer que les queries DB sont toujours filtrées par org_id. Souvent ils implémentent le check au niveau de l'authentification ("ce user existe-t-il dans cette org ?") mais oublient le check au niveau de l'autorisation ("ce user a-t-il le droit d'accéder à CETTE ressource dans CETTE org ?").

---

## Bruteforcer comme un bourrin

Tu trouves une IDOR sur `GET /api/users/{id}`. Tu te dis "je vais énumérer tous les users" et tu lances une boucle de 1 à 1 million.

```python
for i in range(1, 1000000):
    requests.get(f"https://target.com/api/users/{i}")
```

Tu te fais rate-limit au bout de 100 requêtes, ton IP se fait ban, l'équipe sécu reçoit une alerte et ton compte est suspendu, ton rapport est rejeté pour "testing excessif".

C'est pas nécessaire pour prouver la vuln — si tu accèdes à 5 ressources qui ne t'appartiennent pas, t'as prouvé l'IDOR. Pas besoin d'en récupérer 10 000. C'est hors scope — la plupart des programmes interdisent l'extraction massive de données, même via une vuln légitime. C'est détectable — les équipes sécu ont des alertes sur les patterns d'énumération. C'est potentiellement illégal — selon la juridiction, extraire des données en masse peut être considéré différemment d'un simple test de sécurité.

Vérifie que l'IDOR existe sur 3-5 IDs différents, manuellement, à des intervalles normaux. Documente le pattern : "Les IDs sont séquentiels de 1 à N. J'ai vérifié que les IDs 100, 101, 102 (qui ne m'appartiennent pas) sont accessibles. Le même pattern s'applique vraisemblablement à tous les IDs." Estime l'échelle : si t'as accès à un endpoint qui liste le nombre total d'objets ou le dernier ID créé, mentionne-le. "Le dernier document créé a l'ID 847293, suggérant que ~850K documents sont potentiellement exposés."

Si tu dois vraiment énumérer pour prouver un impact, fais-le lentement avec une requête par seconde max, utilise un échantillon représentatif comme tous les 100 IDs, limite-toi à quelques centaines de requêtes, et préviens le programme avant si possible.

---

> [!INFO]
> **Navigation :**
> - [← La méthode qui marche](/articles/idor-partie-1)
> - [Les trucs que presque personne explique →](/articles/idor-partie-3)
