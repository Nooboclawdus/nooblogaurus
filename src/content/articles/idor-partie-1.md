# IDOR : La méthode qui marche

*La méthode 2-comptes, le setup qui marche, et les règles du jeu.*

> [!TIP]
> **Cet article est en 3 parties :**
> - **Partie 1** (tu es ici) — La méthode qui marche
> - [Partie 2](/articles/idor-partie-2) — Les conneries à éviter
> - [Partie 3](/articles/idor-partie-3) — Les trucs que presque personne explique

---

Si t'es là, c'est que t'as probablement déjà lu 47 articles qui t'expliquent qu'une IDOR c'est quand tu changes `id=1` en `id=2`. Bravo, tu sais lire une URL. Maintenant on va parler des trucs que personne t'explique : pourquoi tu rates des IDOR, comment automatiser sans te faire ban, et ce que les devs font de travers pour que ça existe encore en 2026.

Spoiler : c'est pas compliqué. C'est juste que tout le monde fait les mêmes erreurs.

---

## Ce que cet article n'est pas

C'est pas un cours sur ce qu'est une IDOR — va sur [PortSwigger](https://portswigger.net/web-security/access-control/idor) si t'as besoin d'un rappel. C'est pas non plus une liste de bounties pour te faire rêver (ça varie trop selon les programmes), ni un énième guide théorique sans rien de concret.

Ce qu'on va couvrir : la méthode qui marche, les erreurs qui te font perdre du temps, et du code réel pour comprendre pourquoi les devs se plantent.

---

## Les règles du jeu

Avant d'aller plus loin, une mise au point importante. En bug bounty, tu testes des applications en production avec de vraies données utilisateurs. Y'a des limites à ne pas franchir.

Ce qu'on fait : lire des données qui ne nous appartiennent pas (avec parcimonie, juste pour prouver la vuln), modifier ses propres ressources pour comprendre les endpoints, vérifier qu'un endpoint destructif est atteignable sans faire de dégâts.

> [!WARNING]
> Ce qu'on ne fait PAS : supprimer les ressources d'autres utilisateurs, modifier leurs données (sauf cas très spécifiques et réversibles), énumérer massivement des données sensibles, exfiltrer des données au-delà de ce qui est nécessaire pour la preuve.

Pour les actions destructives comme DELETE ou certains PUT, la méthode safe c'est de tester d'abord sur TES PROPRES ressources pour identifier l'endpoint et son comportement. Ensuite, tu vérifies que le contrôle d'accès ne bloque pas quand tu cibles une ressource d'un autre user, mais tu évites l'effet destructif.

Un `200 OK` sur un DELETE n'est pas automatiquement une preuve safe, parce qu'un 200 peut déjà vouloir dire "c'est supprimé". Ce que tu veux prouver, c'est que la requête a passé l'autorisation et a atteint la logique métier, sans avoir besoin de casser les données.

Attention, un `403 Forbidden` ne veut pas toujours dire "rien ne s'est passé". Certaines implémentations vérifient l'autorisation APRÈS avoir exécuté l'action, ou exécutent partiellement avant de bloquer. Un endpoint peut te renvoyer 403 et quand même avoir supprimé la ressource côté serveur — c'est rare mais ça existe, surtout sur du code legacy ou des middlewares mal ordonnés. N'assume jamais qu'un 403 = safe sans vérifier l'état de la ressource après coup.

Et les suppressions ne passent pas toujours par un `DELETE`. Un `GET /api/documents/123?action=delete` ou `POST /api/documents/remove` avec un ID dans le body, c'est courant. Certaines apps utilisent des query params comme `?delete=true`, des actions dans le body JSON, ou même des webhooks internes. Mappe tous les endpoints qui modifient l'état, pas juste ceux qui utilisent les verbes HTTP "évidents".

Ce que tu cherches idéalement : un comportement qui échoue APRÈS la phase d'autorisation — une erreur de précondition, de validation, de payload invalide. Si tu obtiens un 412 ou un 400 au lieu d'un 403, c'est un signal fort que l'endpoint est atteignable sans contrôle d'accès.

Beaucoup de programmes demandent explicitement de ne pas supprimer ou modifier les données d'autres utilisateurs. Lis les règles du programme avant de tester.

---

## La méthode 2-comptes

Tout le monde dit "crée deux comptes". Personne t'explique comment t'organiser pour pas devenir fou.

### Pourquoi deux comptes

La question paraît bête, mais elle mérite qu'on s'y arrête. Une IDOR, c'est accéder à une ressource qui ne t'appartient pas. Pour prouver que t'accèdes à quelque chose qui n'est pas à toi, tu dois d'abord savoir ce qui EST à toi.

Avec un seul compte, tu testes à l'aveugle. Tu changes un ID et tu vois une réponse. Mais est-ce que cette réponse contient des données d'un autre user ? Ou c'est juste des données publiques ? Ou c'est ton propre compte avec un ID différent ? Tu sais pas.

Avec deux comptes, tu sais exactement ce que le compte B possède, ce que le compte A (attaquant) est censé voir, et si A accède aux ressources de B, c'est une IDOR. Point.

> [!NOTE]
> Dans la suite de cet article, **B = la cible** (le compte victime, le "bizuté") et **A = l'attaquant** (le compte qui teste). Je schématise pour que ce soit clair — dans la réalité, il y a toujours des cas particuliers.

Si l'application a une notion d'organisation ou d'équipe, pense à tester deux scénarios : deux comptes séparés (chacun dans sa propre org), et deux comptes dans la MÊME organisation avec des rôles différents. Les IDOR intra-org et cross-org ne sont pas les mêmes vulns et ne sont pas protégées par les mêmes checks.

### Le setup

Le compte B c'est la victime — celui dont tu vas essayer d'accéder aux ressources depuis l'autre compte. Crée-le en premier et remplis-le. Un profil complet avec nom, email, avatar, bio. Des ressources variées : documents, messages, commandes, projets, tout ce que l'app permet. Des actions dans l'historique si l'app a des logs d'activité. Donne-lui un nom explicite que tu reconnaîtras dans ton proxy — `Victime-Test` ou `IDOR-Target` par exemple, pas juste "John".

Pendant que tu fais ça, note méticuleusement tous les IDs que tu croises. Pas juste dans l'URL — partout. Le user_id, le profile_id, les document_ids, l'org_id, le session_token. Tu vas avoir besoin de ces IDs plus tard pour tester depuis le compte A.

```
# Compte B (victime)
user_id: 1337
profile_id: 8842
document_ids: ["abc-123", "def-456", "ghi-789"]
org_id: 42
```

> [!TIP]
> **Garde tes IDs sous les yeux.** Dans Caido ou Burp, crée des colonnes ou des règles de highlight avec des regex qui matchent les IDs de tes comptes. Par exemple, un match & highlight sur `1337` pour repérer instantanément les requêtes qui touchent au compte B. Tu peux aussi ajouter les IDs dans un scope ou une liste de référence dans ton proxy — ça évite de fouiller dans tes notes à chaque requête.

Le compte A c'est l'attaquant. Deuxième compte, créé avec un email différent. Ce compte reste relativement vide — son seul but est de tenter d'accéder aux ressources du compte B.

### L'organisation physique

C'est là que la plupart des gens se plantent. Tu te retrouves avec 15 onglets ouverts, tu sais plus quel compte est connecté où, et tu perds 20 minutes à debug un "problème" qui était juste une confusion de session.

![Where session?](/images/comptesAB.png)

La solution qui marche c'est d'avoir une séparation physique impossible à confondre. Deux navigateurs différents (pas juste deux fenêtres) — Firefox pour A, Chrome pour B par exemple. Ou deux profils de navigateur — Chrome a une gestion de profils native, chaque profil a ses propres cookies. Ou un navigateur plus la navigation privée, mais attention, la nav privée partage parfois des trucs avec la session normale.

Mon setup préféré c'est [PwnFox](https://github.com/yeswehack/PwnFox), l'extension Firefox qui utilise les Multi-Account Containers pour isoler tes sessions. Chaque container a ses propres cookies, et bonus : le trafic est coloré dans Burp ou Caido selon le container. Tu peux avoir 5 comptes dans le même navigateur sans te mélanger. Container rouge pour la victime, container bleu pour l'attaquant. Quand tu regardes le proxy, tu sais immédiatement quelle session c'est.

> [!TIP]
> PwnFox avec 2 containers (rouge = victime, bleu = attaquant). Le trafic est automatiquement coloré dans ton proxy — impossible de confondre les sessions.

**Alternative sans extension :** deux navigateurs (Firefox + Chrome) avec un User-Agent custom sur chacun. Dans Chrome, tu mets un UA modifié via les DevTools ou un profil, genre `Mozilla/5.0 (ATTACKER)`. Ensuite dans ton proxy, une règle de highlight ou un filtre sur le User-Agent et t'as ta séparation visuelle sans installer quoi que ce soit. Ça marche aussi bien que PwnFox pour le cas 2-comptes basique.

Ton proxy (Caido, Burp, peu importe) intercepte le trafic des deux navigateurs. Configure-le pour distinguer les deux avec des tags ou des couleurs si ton proxy le permet, ou simplement fais tes actions avec B d'abord, note les requêtes, puis passe à A.

### Le workflow

Tu commences par la cartographie avec le compte B. Connecte-toi et utilise l'application normalement. Explore chaque fonctionnalité : consulte ton profil, modifie tes paramètres, crée des ressources, supprime une ressource pour voir l'endpoint de suppression, accède à l'historique et aux logs et aux exports. Pendant ce temps, ton proxy capture tout. À la fin, tu as une liste complète des endpoints que l'application expose et les IDs associés à ton compte.

Ensuite tu identifies les endpoints sensibles dans ton historique de proxy. Les requêtes qui contiennent des IDs et qui retournent ou manipulent des données sensibles : `GET /api/users/1337` pour la lecture de profil, `PUT /api/users/1337` pour la modification, `DELETE /api/documents/abc-123` pour la suppression, `POST /api/messages` avec `{"to": "1337"}` pour l'envoi de message. Classe-les par type d'action : lecture, création, modification, suppression.

Maintenant passe sur le navigateur avec le compte A (attaquant) connecté. Pour chaque endpoint identifié, tu prends la requête capturée avec B, tu remplaces le cookie ou token d'authentification par celui de A, tu envoies la requête, et tu compares la réponse.

Ce que tu cherches : un `200 OK` avec les données de B c'est une IDOR de lecture. Un `200 OK` sur une modification non destructive comme changer un titre c'est une IDOR d'écriture. Pour les endpoints destructifs, vérifie d'abord le comportement sur TES propres ressources, puis prouve que le contrôle d'accès ne bloque pas quand tu changes l'ID, sans déclencher la suppression. Un `403 Forbidden` ou `404 Not Found` veut généralement dire que l'access control fonctionne — mais vérifie quand même l'état de la ressource, un 403 n'est pas toujours une garantie que rien ne s'est passé côté serveur.

Pour chaque IDOR trouvée, documente immédiatement : l'endpoint exact avec méthode, URL et paramètres, la requête complète avec headers et body, la réponse obtenue, et l'impact — quelles données sont exposées, quelle action est possible.

<!-- DIAGRAM:method -->

---

> [!INFO]
> **Suite** : [Les conneries à éviter →](/articles/idor-partie-2)
