# Google Dorks

> Advanced Google search operators for OSINT and reconnaissance. Always scope to authorized targets.

## Quickstart

```text
# Scope to target domain
site:target.com

# Find login pages
site:target.com inurl:login OR inurl:signin

# Find exposed files
site:target.com filetype:pdf OR filetype:xlsx

# Find admin panels
site:target.com intitle:"admin" OR inurl:admin

# Exclude noise
site:target.com -inurl:blog -inurl:tag
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| `site:` | Restrict to domain/path (always use first!) |
| Matchers | `inurl:`, `intitle:`, `intext:`, `filetype:` |
| Boolean | `OR`, `-exclude`, `"exact phrase"` |
| Limitations | Only indexed content, not exhaustive |

## Syntax

```text
site:target.com <operator>:<value> <keyword>
```

## Operators

### Scope & Target

| Operator | Description | Example |
|----------|-------------|---------|
| `site:` | Domain/subdomain/path | `site:target.com` |
| `site:*.target.com` | All subdomains | `site:*.target.com -www` |

### Content Type

| Operator | Description | Example |
|----------|-------------|---------|
| `filetype:` | File extension | `filetype:pdf` |
| `ext:` | Alias for filetype | `ext:sql` |

### URL Matching

| Operator | Description | Example |
|----------|-------------|---------|
| `inurl:` | Word in URL | `inurl:admin` |
| `allinurl:` | All words in URL | `allinurl:admin login` |

### Title Matching

| Operator | Description | Example |
|----------|-------------|---------|
| `intitle:` | Word in title | `intitle:dashboard` |
| `allintitle:` | All words in title | `allintitle:admin panel` |

### Body Matching

| Operator | Description | Example |
|----------|-------------|---------|
| `intext:` | Word in page body | `intext:password` |
| `allintext:` | All words in body | `allintext:username password` |

### Boolean & Modifiers

| Operator | Description | Example |
|----------|-------------|---------|
| `"phrase"` | Exact match | `"index of"` |
| `OR` | Either term | `admin OR administrator` |
| `-term` | Exclude | `-inurl:docs` |
| `*` | Wildcard | `"admin * panel"` |
| `..` | Number range | `2020..2024` |

### Date Filters

| Operator | Description | Example |
|----------|-------------|---------|
| `after:YYYY-MM-DD` | After date | `after:2024-01-01` |
| `before:YYYY-MM-DD` | Before date | `before:2024-12-31` |

## Recipes

### Subdomain Discovery

```text
# Find indexed subdomains
site:*.target.com -www

# Specific subdomain patterns
site:*.target.com inurl:api
site:*.target.com inurl:dev OR inurl:staging
```

### Exposed Files

```text
# Documents
site:target.com filetype:pdf OR filetype:doc OR filetype:xlsx

# Config files
site:target.com filetype:xml OR filetype:json OR filetype:yml

# Database dumps
site:target.com filetype:sql OR filetype:bak

# Log files
site:target.com filetype:log

# Source code
site:target.com filetype:php OR filetype:asp OR filetype:jsp
```

### Login & Admin Pages

```text
# Login pages
site:target.com inurl:login OR inurl:signin OR inurl:auth

# Admin panels
site:target.com inurl:admin OR inurl:administrator OR inurl:wp-admin

# Dashboards
site:target.com intitle:dashboard OR intitle:"control panel"

# Portals
site:target.com inurl:portal OR inurl:cpanel
```

### Sensitive Information

```text
# Directory listings
site:target.com intitle:"index of"

# Exposed env files
site:target.com filetype:env OR inurl:.env

# Config exposure
site:target.com inurl:config OR inurl:settings

# API documentation
site:target.com inurl:swagger OR inurl:api-docs

# Error messages
site:target.com intext:"sql syntax" OR intext:"mysql_fetch"
```

### Bug Bounty Recon

```text
# Find parameters
site:target.com inurl:?id= OR inurl:?page= OR inurl:?file=

# Find redirects
site:target.com inurl:redirect OR inurl:url= OR inurl:next=

# Find uploads
site:target.com inurl:upload OR inurl:file

# Find old/backup versions
site:target.com inurl:old OR inurl:backup OR inurl:bak

# Find test/dev environments
site:target.com inurl:test OR inurl:dev OR inurl:staging
```

### Filtering Noise

```text
# Exclude common noise
site:target.com -inurl:tag -inurl:category -inurl:page -inurl:author

# Exclude documentation
site:target.com -inurl:docs -inurl:help -inurl:support

# Exclude CDN/static
site:target.com -site:cdn.target.com -site:static.target.com
```

### Time-Scoped Searches

```text
# Recent content only
site:target.com after:2024-01-01

# Specific time window
site:target.com after:2024-06-01 before:2024-06-30
```

### Cross-Site Searches

```text
# GitHub code
site:github.com "target.com"

# Pastebin leaks
site:pastebin.com "target.com"

# Trello boards
site:trello.com "target.com"

# AWS S3 buckets
site:s3.amazonaws.com "target"
```

## Output & Workflow

1. **Start broad:** `site:target.com`
2. **Narrow down:** Add `inurl:`, `filetype:`, `intitle:`
3. **Exclude noise:** Use `-inurl:`, `-site:`
4. **Document findings:** Save interesting URLs
5. **Verify manually:** Google results aren't always current

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results | Page may not be indexed |
| Too many results | Add more operators, use exclusions |
| Stale results | Content may have changed, verify manually |
| Operator not working | `cache:` and `related:` are deprecated |

## References

- [Google Search Operators (Ahrefs)](https://ahrefs.com/blog/google-advanced-search-operators/)
- [Google Hacking Database (GHDB)](https://www.exploit-db.com/google-hacking-database)
- [DorkSearch](https://dorksearch.com/)
