# gau

> Get All URLs — récupère les URLs d'une cible depuis Wayback Machine, Common Crawl, OTX, URLScan. Essentiel pour la découverte de surface d'attaque. Use only on authorized targets.

## Quickstart

```bash
# Récupérer toutes les URLs d'un domaine
gau target.com

# Avec sous-domaines
gau --subs target.com

# Sauvegarder les résultats
gau target.com | tee urls.txt

# Filtre par extension
gau target.com | grep -E "\.(php|asp|aspx|jsp)$"
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Sources | Wayback Machine, Common Crawl, OTX, URLScan |
| Crawl depth | Archives historiques — URLs même supprimées |
| `--subs` | Inclure tous les sous-domaines |
| `--threads` | Nombre de requêtes parallèles |
| Providers | Sélectionner quelles sources utiliser |

## Installation

```bash
# Via go install
go install github.com/lc/gau/v2/cmd/gau@latest

# Via apt (Kali/Parrot)
apt install gau

# Vérifier
gau --version
```

## Syntax

```text
gau [flags] <target>
echo "target.com" | gau [flags]
gau --list domains.txt [flags]
```

## Options

### Sources

| Option | Description |
|--------|-------------|
| `--providers wayback` | Wayback Machine uniquement |
| `--providers commoncrawl` | Common Crawl uniquement |
| `--providers otx` | AlienVault OTX |
| `--providers urlscan` | URLScan.io |

### Filtres

| Option | Description |
|--------|-------------|
| `--subs` | Inclure les sous-domaines |
| `--blacklist ext` | Exclure certaines extensions |
| `--fc 404,302` | Filtrer par codes HTTP (avec `--mc`) |
| `--from 2022` | URLs depuis cette année |
| `--to 2026` | URLs jusqu'à cette année |

### Performance

| Option | Description |
|--------|-------------|
| `--threads 5` | Threads parallèles (défaut: 1) |
| `--timeout 45` | Timeout en secondes |
| `--retries 3` | Retries en cas d'échec |
| `--rate-limit 10` | Requêtes par seconde |

### Output

| Option | Description |
|--------|-------------|
| `--json` | Sortie JSON |
| `--o <file>` | Fichier de sortie |
| `--verbose` | Mode verbose |

## Recettes Bug Bounty

### Découverte de Surface d'Attaque

```bash
# URLs + sous-domaines, dédupliqué
gau --subs target.com | sort -u | tee all-urls.txt

# Filtrer par paramètres (IDOR/injection candidates)
gau target.com | grep "?" | tee urls-with-params.txt

# Endpoints API
gau target.com | grep -E "/api/|/v[0-9]+/" | sort -u
```

### Trouver des Fichiers Sensibles

```bash
# Anciens fichiers de config, backup
gau target.com | grep -E "\.(bak|old|backup|sql|env|config|xml|json)$"

# Archives
gau target.com | grep -E "\.(zip|tar|gz|7z|rar)$"

# Fichiers debug/dev
gau target.com | grep -iE "(debug|test|dev|staging|admin|backup)"
```

### Trouver des Endpoints JavaScript

```bash
# JS files pour extraction d'endpoints
gau target.com | grep "\.js$" | sort -u | tee js-files.txt

# Passer à LinkFinder
cat js-files.txt | while read url; do
  python3 linkfinder.py -i "$url" -o cli 2>/dev/null
done | sort -u

# Ou via katana
katana -list js-files.txt -jc
```

### URLs avec Paramètres (IDOR / Injection)

```bash
# Extraire les paramètres uniques
gau target.com | grep "?" | uro | sort -u

# Via uro (URL deduplication)
gau target.com | uro | tee deduped-urls.txt

# Paramètres numériques (candidats IDOR)
gau target.com | grep "?" | grep -E "[?&][a-z_]+=[0-9]{1,10}(&|$)"

# Combiner avec httpx pour vérifier si toujours en ligne
gau target.com | httpx -silent -mc 200,301,302 -o live-urls.txt
```

### Recherche de Secrets Exposés

```bash
# Passer les JS à SecretFinder
gau target.com | grep "\.js$" | httpx -silent | while read url; do
  python3 secretfinder.py -i "$url" -o cli 2>/dev/null
done

# Combiné avec grep
gau target.com | grep "\.js$" | xargs -I {} sh -c \
  'curl -sk "{}" | grep -iE "api[_-]?key|secret|token|password|auth"'
```

### Sur Plusieurs Cibles

```bash
# Liste de domaines
cat domains.txt | gau --threads 5 | sort -u > all-urls.txt

# Ou avec --list
gau --list domains.txt --threads 5 | sort -u
```

## Pipeline Complet (Recon)

```bash
# Découverte complète avec filtres
gau --subs target.com | \
  grep -vE "\.(png|jpg|gif|css|woff|ico|svg|mp4|pdf)$" | \
  sort -u | \
  httpx -silent -mc 200,301,302,403 | \
  tee live-endpoints.txt

# Afficher les stats
wc -l live-endpoints.txt
```

## Combiner avec d'autres outils

```bash
# gau + waybackurls (double coverage)
{ gau target.com; waybackurls target.com; } | sort -u | uro

# gau + katana (passif + actif)
gau target.com | sort -u > gau-urls.txt
katana -u https://target.com -o katana-urls.txt
cat gau-urls.txt katana-urls.txt | sort -u > all-urls.txt

# gau + nuclei (scan automatique)
gau target.com | nuclei -t cves/ -rate-limit 10
```

## Troubleshooting

| Problème | Solution |
|----------|----------|
| Rate limited | Ajouter `--rate-limit 5`, changer IP |
| Peu de résultats | Ajouter `--subs`, tester providers différents |
| Trop de résultats | Ajouter `--blacklist png,jpg,gif,css` |
| Timeout | Augmenter `--timeout 90` |
| Erreur providers | Vérifier connexion, essayer `--providers wayback` uniquement |

## Références

- [GitHub lc/gau](https://github.com/lc/gau)
- [uro (URL dedup)](https://github.com/s0md3v/uro)
- [waybackurls](https://github.com/tomnomnom/waybackurls)
