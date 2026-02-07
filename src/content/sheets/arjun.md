# arjun

> HTTP parameter discovery tool.

## Quickstart

```bash
# Find GET parameters
arjun -u https://target.com/endpoint

# Find POST parameters
arjun -u https://target.com/api -m POST

# JSON parameters
arjun -u https://target.com/api -m JSON
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Parameter mining | Find hidden/undocumented params |
| Methods | GET, POST, JSON, XML |
| Wordlist | Built-in + custom |

## Syntax

```text
arjun -u <url> [options]
arjun -i <file> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-u <url>` | Single URL |
| `-i <file>` | URL list |
| `-m <method>` | GET, POST, JSON, XML |

### Discovery

| Option | Description |
|--------|-------------|
| `-w <file>` | Custom wordlist |
| `--include <params>` | Include specific params |
| `--stable` | Stable mode (slower) |

### Request

| Option | Description |
|--------|-------------|
| `-H <header>` | Custom header |
| `--headers <file>` | Headers file |
| `-d <data>` | Body data |

### Output

| Option | Description |
|--------|-------------|
| `-oT <file>` | Text output |
| `-oJ <file>` | JSON output |
| `-oB <file>` | Burp output |
| `-q` | Quiet mode |

### Performance

| Option | Description |
|--------|-------------|
| `-t <n>` | Threads |
| `--rate-limit <n>` | Requests per second |
| `--timeout <sec>` | Timeout |

## Recipes

### GET Parameters

```bash
# Basic discovery
arjun -u https://target.com/search

# With output
arjun -u https://target.com/search -oJ params.json

# Custom wordlist
arjun -u https://target.com/api -w params.txt
```

### POST Parameters

```bash
# POST form
arjun -u https://target.com/login -m POST

# With existing data
arjun -u https://target.com/api -m POST -d "known=value"
```

### JSON Parameters

```bash
# JSON API
arjun -u https://target.com/api/v1/users -m JSON

# With auth
arjun -u https://target.com/api -m JSON -H "Authorization: Bearer token"
```

### Multiple URLs

```bash
# From file
arjun -i urls.txt -oJ results.json

# From stdin
cat urls.txt | arjun -i -
```

### With Authentication

```bash
# Cookie
arjun -u https://target.com/api -H "Cookie: session=abc123"

# Bearer token
arjun -u https://target.com/api -H "Authorization: Bearer token"
```

### Pipeline

```bash
# katana → arjun
katana -u https://target.com -silent | grep "?" | arjun -i -

# Feed to ffuf
arjun -u https://target.com/api -oJ params.json
cat params.json | jq -r '.[] | keys[]' | while read param; do
  ffuf -u "https://target.com/api?${param}=FUZZ" -w values.txt
done
```

## Output & Parsing

```bash
# JSON output
arjun -u https://target.com/api -oJ params.json
cat params.json | jq -r '.[] | keys[]'

# Text output
arjun -u https://target.com/api -oT params.txt

# Burp format
arjun -u https://target.com/api -oB params.burp
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No params found | Try different method, custom wordlist |
| Rate limited | Use `--rate-limit` |
| False positives | Use `--stable` mode |

## References

- [Arjun GitHub](https://github.com/s0md3v/Arjun)
