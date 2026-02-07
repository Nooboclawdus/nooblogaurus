# feroxbuster

> Fast recursive content discovery tool written in Rust.

## Quickstart

```bash
# Basic scan
feroxbuster -u https://target.com

# With wordlist
feroxbuster -u https://target.com -w wordlist.txt

# Recursive (default)
feroxbuster -u https://target.com -w wordlist.txt

# With extensions
feroxbuster -u https://target.com -w wordlist.txt -x php,txt,bak
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Recursive | Auto-discovers and scans directories |
| Smart filtering | Auto-detects and filters noise |
| Parallel | Very fast, written in Rust |
| Resumable | Can pause and resume scans |

## Syntax

```text
feroxbuster -u <url> [options]
feroxbuster --stdin [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL |
| `--stdin` | Read URLs from stdin |
| `-w <file>` | Wordlist |

### Extensions

| Option | Description |
|--------|-------------|
| `-x <ext>` | Extensions (php,txt,bak) |
| `-X <ext>` | Extensions file |
| `--add-slash` | Append / to requests |

### Recursion

| Option | Description |
|--------|-------------|
| `-n` | No recursion |
| `-d <n>` | Recursion depth |
| `--dont-extract-links` | Don't extract links |

### Filters

| Option | Description |
|--------|-------------|
| `-s <codes>` | Show status codes |
| `-C <codes>` | Filter status codes |
| `-S <size>` | Filter size |
| `-W <words>` | Filter word count |
| `-L <lines>` | Filter line count |
| `--filter-regex <r>` | Filter by regex |
| `--auto-tune` | Auto-filter noise |

### Request

| Option | Description |
|--------|-------------|
| `-H <header>` | Header |
| `-b <cookie>` | Cookie |
| `-a <ua>` | User agent |
| `-p <proxy>` | Proxy |
| `-k` | Insecure (skip TLS verify) |
| `-A` | Random user agent |
| `-m <method>` | HTTP method |
| `--data <data>` | POST data |
| `-t <n>` | Threads (default 50) |
| `-T <sec>` | Timeout |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `--json` | JSON output |
| `-q` | Quiet mode |
| `-v` | Verbose |
| `--no-state` | Don't save state |

## Recipes

### Basic Scanning

```bash
# Quick scan
feroxbuster -u https://target.com

# Custom wordlist
feroxbuster -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt

# Disable recursion
feroxbuster -u https://target.com -n

# Limit depth
feroxbuster -u https://target.com -d 2
```

### With Extensions

```bash
# PHP site
feroxbuster -u https://target.com -x php

# Multiple extensions
feroxbuster -u https://target.com -x php,asp,aspx,jsp,txt,bak,old,zip

# Extensions file
echo -e "php\nasp\ntxt" > ext.txt
feroxbuster -u https://target.com -X ext.txt
```

### Filtering

```bash
# Only show 200, 301, 302
feroxbuster -u https://target.com -s 200,301,302

# Filter out 404, 403
feroxbuster -u https://target.com -C 404,403

# Filter by size (hide 1234 bytes)
feroxbuster -u https://target.com -S 1234

# Filter by words
feroxbuster -u https://target.com -W 100

# Auto-tune (smart filtering)
feroxbuster -u https://target.com --auto-tune
```

### Performance

```bash
# Fast scan
feroxbuster -u https://target.com -t 100

# Slower, stealthy
feroxbuster -u https://target.com -t 10 --rate-limit 10

# Very fast (aggressive)
feroxbuster -u https://target.com -t 200 --no-state
```

### With Authentication

```bash
# Cookie
feroxbuster -u https://target.com -b "session=abc123"

# Header
feroxbuster -u https://target.com -H "Authorization: Bearer token"

# Multiple headers
feroxbuster -u https://target.com -H "X-Custom: val" -H "Authorization: Bearer token"
```

### Through Proxy

```bash
# Burp/Caido
feroxbuster -u https://target.com -p http://127.0.0.1:8080

# Skip TLS verify
feroxbuster -u https://target.com -p http://127.0.0.1:8080 -k
```

### Multiple Targets

```bash
# From stdin
cat urls.txt | feroxbuster --stdin

# With options
cat urls.txt | feroxbuster --stdin -x php -d 2
```

### Link Extraction

```bash
# Extract links from responses (default)
feroxbuster -u https://target.com

# Disable link extraction
feroxbuster -u https://target.com --dont-extract-links
```

### Resume Scan

```bash
# Pause with Ctrl+C (saves state)
# Resume
feroxbuster --resume-from ferox-state.json
```

## Output & Parsing

```bash
# JSON output
feroxbuster -u https://target.com --json -o results.json

# Plain text
feroxbuster -u https://target.com -o results.txt

# Parse JSON
cat results.json | jq -r '.url'

# Filter JSON by status
cat results.json | jq -r 'select(.status == 200) | .url'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too noisy | Use `--auto-tune`, add filters |
| Too slow | Increase `-t` |
| Rate limited | Add `--rate-limit` |
| SSL errors | Add `-k` |
| Memory issues | Reduce `-t`, add `--no-state` |

## References

- [feroxbuster GitHub](https://github.com/epi052/feroxbuster)
- [feroxbuster Docs](https://epi052.github.io/feroxbuster-docs/)
