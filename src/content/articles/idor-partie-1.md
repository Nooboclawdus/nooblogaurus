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



---

> [!INFO]
> **Suite** : [Partie 2 — Automatisation & Erreurs →](/articles/idor-partie-2)
