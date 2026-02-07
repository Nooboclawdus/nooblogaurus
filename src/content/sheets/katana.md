# katana

> Fast web crawler for collecting URLs and endpoints. ProjectDiscovery.

## Quickstart

```bash
# Crawl single URL
katana -u https://target.com

# Crawl with JS rendering
katana -u https://target.com -headless

# Crawl list of URLs
katana -list urls.txt

# Pipe to nuclei
katana -u https://target.com -silent | nuclei -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Crawling | Follow links and discover endpoints |
| Headless | Use browser for JS-heavy sites |
| Scope | Control what gets crawled |
| Passive | Extract URLs without making requests |

## Syntax

```text
katana -u <url> [options]
katana -list <file> [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-u <url>` | Single URL |
| `-list <file>` | URL list |
| `-` | Read from stdin |
| `-resume <file>` | Resume from file |

### Crawling

| Option | Description |
|--------|-------------|
| `-d <n>` | Max depth (default 3) |
| `-jc` | Crawl JS files |
| `-ct <sec>` | Crawl timeout |
| `-kf` | Keep query string in URLs |
| `-ef <ext>` | Exclude extensions |
| `-em <type>` | Exclude media |
| `-fs <pattern>` | Field scope |

### Headless

| Option | Description |
|--------|-------------|
| `-headless` | Enable headless browser |
| `-hl` | Headless with full browser |
| `-sc` | Use system Chrome |
| `-xhr` | Extract XHR requests |
| `-ws` | Extract WebSocket URLs |

### Scope

| Option | Description |
|--------|-------------|
| `-cs <scope>` | Crawl scope (dn, rdn, fqdn) |
| `-do` | Display out of scope URLs |
| `-fs <regex>` | Filter scope |
| `-sf <domain>` | Scope filter domain |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-json` | JSON output |
| `-silent` | Silent mode |
| `-nc` | No color |
| `-v` | Verbose |

### Performance

| Option | Description |
|--------|-------------|
| `-c <n>` | Concurrency (default 10) |
| `-p <n>` | Parallelism |
| `-rl <n>` | Rate limit |
| `-timeout <sec>` | Timeout |
| `-retry <n>` | Retries |

### Request

| Option | Description |
|--------|-------------|
| `-H "Header: val"` | Custom header |
| `-proxy <url>` | HTTP proxy |
| `-xhr` | XHR extraction |

## Recipes

### Basic Crawling

```bash
# Simple crawl
katana -u https://target.com

# Deeper crawl
katana -u https://target.com -d 5

# Silent output
katana -u https://target.com -silent

# Multiple targets
katana -list urls.txt -silent
```

### JS-Heavy Sites

```bash
# Headless crawling
katana -u https://target.com -headless

# With XHR extraction
katana -u https://target.com -headless -xhr

# System Chrome
katana -u https://target.com -headless -sc
```

### Endpoint Discovery

```bash
# Crawl + JS parsing
katana -u https://target.com -jc

# Keep query strings
katana -u https://target.com -kf

# Extract forms
katana -u https://target.com -f
```

### Scope Control

```bash
# Same domain only
katana -u https://target.com -cs dn

# Include subdomains
katana -u https://target.com -cs rdn

# Exclude file types
katana -u https://target.com -ef png,jpg,gif,css,woff
```

### Pipeline Integration

```bash
# katana → nuclei
katana -u https://target.com -silent | nuclei -silent

# subfinder → httpx → katana
subfinder -d target.com -silent | httpx -silent | katana -silent

# katana → gf (pattern extract)
katana -u https://target.com -silent | gf xss

# Crawl and find params
katana -u https://target.com -silent | grep "?" | sort -u
```

### API Endpoint Discovery

```bash
# Find API endpoints
katana -u https://target.com -silent | grep -E "/api/|/v[0-9]/"

# JSON output for parsing
katana -u https://target.com -json -o crawl.json

# Extract unique paths
katana -u https://target.com -silent | \
  sed 's/\?.*//' | sort -u
```

### Through Proxy

```bash
# Burp/Caido proxy
katana -u https://target.com -proxy http://127.0.0.1:8080

# With headers
katana -u https://target.com -H "Authorization: Bearer token"
```

## Output & Parsing

```bash
# JSON output
katana -u https://target.com -json -o results.json

# Parse JSON
cat results.json | jq -r '.request.endpoint'

# Extract unique endpoints
katana -u https://target.com -silent | sort -u > endpoints.txt

# Filter by pattern
katana -u https://target.com -silent | grep -E "\.(php|asp|jsp)"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing JS endpoints | Use `-headless` |
| Too slow | Reduce `-d`, increase `-c` |
| Stuck on site | Add `-ct` timeout |
| Scope issues | Check `-cs` setting |

## References

- [katana GitHub](https://github.com/projectdiscovery/katana)
- [katana Docs](https://docs.projectdiscovery.io/tools/katana/overview)
