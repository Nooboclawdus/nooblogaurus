# IDOR : Le guide pour ceux qui en ont marre des guides IDOR

*Ou comment j'ai arrêté de lire "changez le 1 en 2" et commencé à trouver des trucs.*

> [!TIP]
> **TL;DR** — Ce que tu vas apprendre : la méthode 2-comptes bien organisée, automatiser avec Autorize (Caido), les 6 erreurs classiques qui te font perdre du temps, et comment escalader l'impact de tes findings. Skip les sections que tu maîtrises déjà.

---

Si t'es là, c'est que t'as probablement déjà lu 47 articles qui t'expliquent qu'une IDOR c'est quand tu changes `id=1` en `id=2`. Bravo, tu sais lire une URL. Maintenant on va parler des trucs que personne t'explique : pourquoi tu rates des IDOR, comment automatiser sans te faire ban, et ce que les devs font de travers pour que ça existe encore en 2026.

Spoiler : c'est pas compliqué. C'est juste que tout le monde fait les mêmes erreurs.

---

## Ce que cet article n'est pas

- Un cours sur ce qu'est une IDOR (va sur [PortSwigger](https://portswigger.net/web-security/access-control/idor) si t'as besoin)
- Une liste de bounties pour te faire rêver (ça varie trop selon les programmes)
- Un énième guide théorique sans rien de concret

Ce qu'on va couvrir : la méthode qui marche, les erreurs qui te font perdre du temps, et du code réel pour comprendre pourquoi les devs se plantent.

---

## Les règles du jeu (à lire avant tout)

Avant d'aller plus loin, une mise au point importante. En bug bounty, tu testes des applications en production avec de vraies données utilisateurs. Y'a des limites à ne pas franchir.

**Ce qu'on fait :**
- Lire des données qui ne nous appartiennent pas (avec parcimonie, juste pour prouver la vuln)
- Modifier ses propres ressources pour comprendre les endpoints
- Vérifier qu'un endpoint destructif est *atteignable* sans faire de dégâts

> [!WARNING]
> **Ce qu'on ne fait PAS :**
> - Supprimer les ressources d'autres utilisateurs
> - Modifier les données d'autres utilisateurs (sauf cas très spécifiques et réversibles)
> - Énumérer massivement des données sensibles
> - Exfiltrer des données au-delà de ce qui est nécessaire pour la preuve

**Pour les actions destructives (DELETE, certains PUT) :**

La méthode safe : tu testes d'abord sur TES PROPRES ressources pour identifier l'endpoint et son comportement. Ensuite, tu vérifies que le contrôle d'accès ne bloque pas quand tu cibles une ressource d'un autre user, mais tu évites l'effet destructif.

Important : **un `200 OK` sur un DELETE n'est pas automatiquement une preuve "safe"**, parce qu'un `200` peut déjà vouloir dire "c'est supprimé". Ce que tu veux prouver, c'est surtout : *la requête a passé l'autorisation (authz) et a atteint la logique métier*, sans avoir besoin de casser les données.

En pratique, tu vas chercher des signaux de type :
- réponse qui n'est pas un refus d'accès (`403` / erreur "forbidden" / code GraphQL "FORBIDDEN")
- et idéalement un comportement qui échoue *après* la phase authz (erreur de précondition, validation, payload invalide, etc.)

Beaucoup de programmes demandent explicitement de ne pas supprimer ou modifier les données d'autres utilisateurs. Lis les règles du programme avant de tester.

---

## La méthode 2-comptes en profondeur

Tout le monde dit "crée deux comptes". Personne t'explique comment t'organiser pour pas devenir fou. Alors on va le faire.

### Pourquoi deux comptes ?

La question paraît bête, mais elle mérite qu'on s'y arrête. Une IDOR, c'est accéder à une ressource qui ne t'appartient pas. Pour prouver que t'accèdes à quelque chose qui n'est pas à toi, tu dois d'abord savoir ce qui EST à toi.

Avec un seul compte, tu testes à l'aveugle. Tu changes un ID et tu vois une réponse. Mais est-ce que cette réponse contient des données d'un autre user ? Ou c'est juste des données publiques ? Ou c'est ton propre compte avec un ID différent ? Tu sais pas.

Avec deux comptes, tu sais exactement :
- Ce que le compte A possède (ses IDs, ses ressources)
- Ce que le compte B est censé voir (uniquement ses propres ressources)
- Si B accède aux ressources de A, c'est une IDOR. Point.

### Le setup qui évite les prises de tête

**Compte A — La victime**

C'est le compte dont tu vas essayer d'accéder aux ressources depuis l'autre compte. Crée-le en premier et remplis-le :

- Un profil complet (nom, email, avatar, bio)
- Des ressources variées (documents, messages, commandes, projets — tout ce que l'app permet)
- Des actions dans l'historique (si l'app a des logs d'activité)

Pendant que tu fais ça, **note méticuleusement tous les IDs que tu croises**. Pas juste dans l'URL — partout :

```
user_id: 1337
profile_id: 8842
document_ids: ["abc-123", "def-456", "ghi-789"]
org_id: 42
session_token: eyJhbGciOiJIUzI1NiIs...
```

Tu vas avoir besoin de ces IDs plus tard pour tester depuis le compte B.

**Compte B — L'attaquant**

Deuxième compte, créé avec un email différent. Ce compte reste relativement vide — son seul but est de tenter d'accéder aux ressources du compte A.

**L'organisation physique**

C'est là que la plupart des gens se plantent. Tu te retrouves avec 15 onglets ouverts, tu sais plus quel compte est connecté où, et tu perds 20 minutes à debug un "problème" qui était juste une confusion de session.

La solution qui marche :

1. **Deux navigateurs différents** (pas juste deux fenêtres) — Firefox pour A, Chrome pour B par exemple
2. **Ou deux profils de navigateur** — Chrome a une gestion de profils native, chaque profil a ses propres cookies
3. **Ou un navigateur + navigation privée** — mais attention, la nav privée partage parfois des trucs avec la session normale
4. **Ou [PwnFox](https://github.com/yeswehack/PwnFox)** — extension Firefox qui utilise les Multi-Account Containers pour isoler tes sessions. Chaque container a ses propres cookies, et bonus : le trafic est coloré dans Burp/Caido selon le container. Tu peux avoir 5 comptes dans le même navigateur sans te mélanger.

L'idée c'est d'avoir une séparation claire impossible à confondre. Quand tu regardes Firefox, c'est A. Quand tu regardes Chrome, c'est B. Ou avec PwnFox : container rouge = victime, container bleu = attaquant. Pas de question à se poser.

> [!TIP]
> **Mon setup préféré** : PwnFox avec 2 containers (rouge = victime, bleu = attaquant). Le trafic est automatiquement coloré dans ton proxy — impossible de confondre les sessions.

**Le proxy au milieu**

Ton proxy (Caido, Burp, peu importe) intercepte le trafic des deux navigateurs. Configure-le pour distinguer les deux :

- Utilise des tags ou des couleurs si ton proxy le permet
- Ou simplement, fais tes actions avec A d'abord, note les requêtes, puis passe à B

### Le workflow pas à pas

**Phase 1 : Cartographie avec le compte A**

Connecte-toi avec A et utilise l'application normalement. Explore chaque fonctionnalité :

- Consulte ton profil
- Modifie tes paramètres
- Crée des ressources (documents, messages, projets)
- Supprime une ressource (pour voir l'endpoint de suppression)
- Accède à l'historique, aux logs, aux exports

Pendant ce temps, ton proxy capture tout. À la fin, tu as une liste complète des endpoints que l'application expose et les IDs associés à ton compte.

**Phase 2 : Identification des endpoints sensibles**

Dans ton historique de proxy, identifie les requêtes qui contiennent des IDs et qui retournent ou manipulent des données sensibles :

- `GET /api/users/1337` — lecture de profil
- `GET /api/documents/abc-123` — lecture de document
- `PUT /api/users/1337` — modification de profil
- `DELETE /api/documents/abc-123` — suppression de document
- `POST /api/messages` avec `{"to": "1337"}` — envoi de message

Classe-les par type d'action : lecture, création, modification, suppression.

**Phase 3 : Test depuis le compte B**

Maintenant, passe sur le navigateur avec le compte B connecté. Pour chaque endpoint identifié :

1. Prends la requête capturée avec A
2. Remplace le cookie/token d'authentification par celui de B
3. Envoie la requête
4. Compare la réponse

**Ce que tu cherches :**

- `200 OK` avec les données de A → IDOR de lecture
- `200 OK` sur une modification non destructive (ex: changer un titre) → IDOR d'écriture
- Pour les endpoints destructifs (DELETE) : vérifie d'abord le comportement sur TES propres ressources, puis prouve que le contrôle d'accès ne bloque pas quand tu changes l'ID, **sans déclencher la suppression**
- `403 Forbidden` ou `404 Not Found` → l'access control fonctionne

**Phase 4 : Documentation**

Pour chaque IDOR trouvée, documente immédiatement :

- L'endpoint exact (méthode + URL + paramètres)
- La requête complète (headers, body)
- La réponse obtenue
- L'impact (quelles données sont exposées, quelle action est possible)

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

L'IDOR, c'est changer un numéro et voir ce qui se passe. C'est efficace. Et c'est toujours là parce que les devs continuent de confondre "connecté" et "autorisé".

La différence entre le hunter qui trouve et celui qui trouve pas, c'est rarement la technique. C'est la méthode : deux comptes, tous les verbes, vérifier les side-effects, chercher l'escalade. Et surtout, la patience de tester systématiquement au lieu de sauter aux conclusions.

Maintenant arrête de lire des articles et va tester des trucs.

---

*Disclaimer obligatoire : teste uniquement sur des programmes autorisés où tu as une permission explicite. Respecte les règles de chaque programme — notamment sur les actions destructives et l'extraction de données. Le bug bounty c'est légal quand tu restes dans le cadre. Hors cadre, c'est la prison.*
