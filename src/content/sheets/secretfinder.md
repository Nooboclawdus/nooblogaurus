# secretfinder

> Find secrets (API keys, tokens) in JavaScript files.

## Quickstart

```bash
# Analyze JS file
secretfinder -i https://target.com/app.js -o cli

# Analyze webpage
secretfinder -i https://target.com -o cli

# HTML report
secretfinder -i https://target.com -o results.html
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Secret detection | API keys, tokens, credentials |
| Regex patterns | Match known secret formats |
| JS analysis | Parse JavaScript files |

## Syntax

```text
secretfinder -i <input> -o <output> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-i <input>` | Input URL or file |
| `-o <output>` | Output (cli, html) |
| `-r <regex>` | Custom regex |
| `-e <ext>` | File extension |
| `-g <pattern>` | Grep pattern |

## Recipes

### Basic Usage

```bash
# Single JS file
secretfinder -i https://target.com/static/js/main.js -o cli

# Full webpage
secretfinder -i https://target.com -o cli

# HTML report
secretfinder -i https://target.com -o secrets.html
```

### Multiple Files

```bash
# Loop through JS files
for js in $(cat js_files.txt); do
  echo "=== $js ===" 
  secretfinder -i "$js" -o cli
done

# Pipeline
cat js_urls.txt | while read url; do
  secretfinder -i "$url" -o cli 2>/dev/null
done | sort -u
```

### Custom Patterns

```bash
# Custom regex
secretfinder -i https://target.com -o cli -r "password['\"]?\s*[:=]\s*['\"][^'\"]+['\"]"

# Grep specific pattern
secretfinder -i https://target.com -o cli -g "api_key"
```

### Pipeline

```bash
# Find JS → extract secrets
katana -u https://target.com -silent | grep "\.js$" | while read js; do
  secretfinder -i "$js" -o cli 2>/dev/null
done | sort -u

# Subfinder → httpx → secretfinder
subfinder -d target.com -silent | httpx -silent | while read url; do
  secretfinder -i "$url" -o cli 2>/dev/null
done
```

## What It Finds

| Secret Type | Example Pattern |
|-------------|-----------------|
| AWS Keys | `AKIA[0-9A-Z]{16}` |
| Google API | `AIza[0-9A-Za-z-_]{35}` |
| Slack Token | `xox[baprs]-...` |
| GitHub Token | `ghp_[0-9A-Za-z]{36}` |
| JWT | `eyJ[A-Za-z0-9-_=]+\.eyJ...` |
| Private Keys | `-----BEGIN.*PRIVATE KEY-----` |
| Passwords | `password\s*=\s*['"]...` |

## Output & Parsing

```bash
# CLI output
secretfinder -i https://target.com -o cli

# Filter by type
secretfinder -i https://target.com -o cli | grep -i "api"

# HTML for review
secretfinder -i https://target.com -o report.html
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No secrets | JS might be minified/obfuscated |
| False positives | Verify findings manually |
| Timeout | Check URL access |

## References

- [SecretFinder GitHub](https://github.com/m4ll0k/SecretFinder)
