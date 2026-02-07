# linkfinder

> JavaScript endpoint extractor.

## Quickstart

```bash
# Analyze JS file
linkfinder -i https://target.com/main.js -o cli

# Analyze webpage (finds JS)
linkfinder -i https://target.com -o cli

# Save to file
linkfinder -i https://target.com/app.js -o results.html
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Endpoint extraction | Find URLs/paths in JS |
| Regex patterns | Match common endpoint formats |
| Burp integration | Works with Burp Suite |

## Syntax

```text
linkfinder -i <input> -o <output> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-i <input>` | Input (URL or file) |
| `-o <output>` | Output (cli, html, file) |
| `-r <regex>` | Custom regex |
| `-d <domain>` | Domain scope |
| `-b` | Burp input mode |
| `-c <cookies>` | Cookies |

## Recipes

### Basic Usage

```bash
# Analyze single JS file
linkfinder -i https://target.com/static/js/main.js -o cli

# Analyze webpage
linkfinder -i https://target.com -o cli

# HTML report
linkfinder -i https://target.com -o results.html
```

### Multiple Files

```bash
# Loop through JS files
for js in $(cat js_files.txt); do
  linkfinder -i "$js" -o cli
done | sort -u

# From URL list
cat js_urls.txt | while read url; do
  linkfinder -i "$url" -o cli
done | sort -u
```

### Domain Scoped

```bash
# Only show target domain endpoints
linkfinder -i https://target.com -o cli -d target.com
```

### With Authentication

```bash
# With cookies
linkfinder -i https://target.com -o cli -c "session=abc123"
```

### Custom Regex

```bash
# Custom pattern
linkfinder -i https://target.com -o cli -r "api/v[0-9]+/[a-z]+"
```

### Pipeline

```bash
# Find JS files then extract
katana -u https://target.com -silent | grep "\.js" | while read js; do
  linkfinder -i "$js" -o cli 2>/dev/null
done | sort -u

# httpx + linkfinder
echo "https://target.com" | httpx -silent | \
  while read url; do linkfinder -i "$url" -o cli; done | sort -u

# Extract and test endpoints
linkfinder -i https://target.com -o cli | \
  grep -E "^/" | \
  sed "s|^|https://target.com|" | \
  httpx -silent
```

### From Burp

```bash
# Use Burp response
linkfinder -i burp_response.txt -b -o cli
```

## Output & Parsing

```bash
# CLI output
linkfinder -i https://target.com -o cli | sort -u

# HTML report
linkfinder -i https://target.com -o report.html

# Filter API endpoints
linkfinder -i https://target.com -o cli | grep -E "/api|/v[0-9]"

# Full URLs
linkfinder -i https://target.com -o cli | grep -E "^http"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No endpoints | JS might be obfuscated |
| Timeout | Check URL, network |
| Too much noise | Use `-d` domain filter |

## References

- [LinkFinder GitHub](https://github.com/GerbenJavado/LinkFinder)
