# caido

> Proxy web moderne pour pentest et bug bounty. Alternative légère à Burp Suite. Interface web, workflows, plugins, et MCP. Use only on authorized targets.

## Quickstart

```bash
# Lancer Caido
caido

# Avec port et adresse custom
caido --listen 127.0.0.1:8080

# Headless (sans UI graphique)
caido --headless
```

## Concepts Clés

| Concept | Description |
|---------|-------------|
| Proxy | Intercept HTTP/S traffic (default 127.0.0.1:8080) |
| Replay | Modifier et rejouer des requêtes |
| Automate | Fuzzer intégré (comme Intruder) |
| Workflows | Automatisation avec plugins HTTPQL |
| Scope | Filtrer les requêtes par domaine/regex |
| Findings | Créer des notes sur les vulnérabilités trouvées |
| Projects | Séparation des engagements |

## Configuration Proxy

```bash
# Configurer le proxy dans le navigateur ou en CLI
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080

# Via ffuf
ffuf -u https://target.com/FUZZ -w wordlist.txt -x http://127.0.0.1:8080

# Via curl
curl -k -x http://127.0.0.1:8080 https://target.com

# Via httpx
httpx -l urls.txt -http-proxy http://127.0.0.1:8080
```

## Installation CA Cert

```bash
# Télécharger le certificat Caido
# Interface web → Settings → CA Certificate → Download

# Installer sur Linux
sudo cp caido-ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Installer dans Firefox
# Paramètres → Vie privée → Certificats → Importer

# Installer dans Chrome
# chrome://settings/certificates → Autorités → Importer

# Vérifier
curl --proxy http://127.0.0.1:8080 https://httpbin.org/get
```

## Scope

```bash
# Format scope (HTTPQL)
# Interface : Settings → Scope → Add Rule

# Inclure un domaine
host == "target.com"

# Inclure un domaine et sous-domaines
host =~ ".*\.target\.com$"

# Inclure plusieurs cibles
host == "target.com" OR host == "api.target.com"

# Exclure assets statiques
host == "target.com" AND path !~ "\.(js|css|png|jpg|gif|ico|woff)$"
```

## HTTPQL (Query Language)

```bash
# Syntaxe générale
field operator value

# Exemples
host == "target.com"           # Hôte exact
path =~ "/api/.*"              # Path regex
status == 200                  # Code HTTP
body =~ "password"             # Corps de réponse
method == "POST"               # Méthode HTTP
header["Authorization"] != ""  # Header présent
size > 1000                    # Taille réponse

# Combinaisons
host == "target.com" AND status == 200 AND body =~ "admin"
(status == 401 OR status == 403) AND path =~ "/admin"
```

## Replay

```bash
# Utilisation basique
# 1. Clic droit sur requête → Send to Replay
# 2. Modifier la requête
# 3. Send (Ctrl+Enter)

# Collections de requêtes
# Organiser plusieurs replays dans des collections
# Utile pour tests d'auth : conserver requêtes avant/après login
```

## Automate (Fuzzer)

```bash
# Similaire à Burp Intruder mais plus rapide

# 1. Clic droit → Send to Automate
# 2. Sélectionner le point d'injection
# 3. Charger une wordlist
# 4. Configurer filtres

# Payloads
- Wordlist (fichier .txt)
- Séquence (range de nombres)
- Null payload (répéter la requête)
- Fichier (upload multiple)

# Filtres sur les résultats
- Status code
- Taille de réponse
- Regex dans le corps
- Temps de réponse (pour timing attacks)
```

## Workflows

```bash
# Les workflows permettent d'automatiser des actions
# Passifs (sur tout le trafic) ou actifs (déclenché manuellement)

# Exemple : log toutes les réponses avec "password" dans le body
# Type: Passive
# Trigger: Response
# Condition: body =~ "password"
# Action: Add Finding

# Exemple : ajouter un header sur toutes les requêtes
# Type: Passive  
# Trigger: Request
# Action: Set Header "X-Debug: true"
```

## Plugins

```bash
# Installer un plugin (interface web)
# Settings → Plugins → Browse / Upload

# Plugins utiles
# - Ebka AI Assistant : analyse les requêtes avec IA
# - Signature : ajouter des signatures aux requêtes
# - Autorize-like : tester les autorisations automatiquement
```

## MCP Integration (AI)

```bash
# Caido expose une API MCP pour les assistants IA
# Permet à l'IA d'interagir avec le proxy

# Configuration mcporter
{
  "servers": {
    "caido": {
      "url": "http://127.0.0.1:8082/mcp",
      "transport": "http"
    }
  }
}

# L'IA peut alors :
# - Lister les requêtes interceptées
# - Rejouer des requêtes
# - Créer des findings
# - Lancer des scans Automate
```

## Findings (Notes vulnérabilités)

```bash
# Créer un finding
# Clic droit sur requête → Add Finding

# Champs
# - Title: nom court de la vuln
# - Description: détails techniques
# - Severity: info/low/medium/high/critical
# - Request: preuve technique

# Exporter pour rapport
# Findings → Export (JSON/Markdown)
```

## API REST Caido

```bash
# API disponible pour automatisation
# Auth: Bearer token (Settings → API Tokens)

# Lister les requêtes récentes
curl -H "Authorization: Bearer TOKEN" \
  http://127.0.0.1:8080/api/v1/requests

# Obtenir une requête spécifique
curl -H "Authorization: Bearer TOKEN" \
  http://127.0.0.1:8080/api/v1/requests/REQ_ID

# Créer un finding via API
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"XSS found","severity":"high","description":"..."}' \
  http://127.0.0.1:8080/api/v1/findings
```

## Recettes Bug Bounty

### Test IDOR automatisé

```bash
# 1. Naviguer avec compte A, noter les IDs d'objets
# 2. Changer de compte B dans le navigateur
# 3. Replay les requêtes de A avec session de B
# 4. Comparer les réponses (taille, contenu)
```

### Fuzzing de paramètres JSON

```bash
# Dans Automate, avec requête POST JSON :
# Body: {"user_id": §1§}
# Wordlist: séquence 1-10000
# Filtre: status == 200 AND size != BASELINE
```

### Trouver des endpoints cachés

```bash
# Dans Automate, avec GET :
# Path: /api/§FUZZ§
# Wordlist: api-endpoints.txt
# Filtre: status != 404
```

### Tester les autorisations (IDOR massif)

```bash
# 1. Collecter toutes les requêtes authentifiées en naviguant
# 2. Modifier le cookie/token session dans Automate
# 3. Rejouer toutes les requêtes avec la session d'un autre utilisateur
# 4. Comparer réponses : taille différente = possible IDOR
```

### Intercepter WebSocket

```bash
# Caido supporte les WebSockets (depuis v0.44+)
# Proxy → WS tab
# Voir le trafic WS, modifier les messages
```

## Troubleshooting

| Problème | Solution |
|----------|----------|
| HTTPS ne fonctionne pas | Installer le CA cert Caido dans le navigateur |
| Tunnel TLS bloqué | Désactiver certificate pinning dans l'appli |
| Trafic non intercepté | Vérifier proxy configuré (127.0.0.1:8080) |
| Plugin ne se charge pas | Vérifier version Caido compatible |
| API rate limit | Réduire threads dans Automate |

## Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Enter` | Envoyer requête (Replay/Automate) |
| `Ctrl+K` | Recherche rapide |
| `Ctrl+/` | Commenter/décommenter |
| `F` | Ouvrir filtres |
| `Échap` | Fermer panneau |

## Références

- [Documentation officielle](https://docs.caido.io)
- [GitHub Caido](https://github.com/caido/caido)
- [Discord Caido](https://discord.gg/caido)
- [Plugins communautaires](https://github.com/caido-community)
