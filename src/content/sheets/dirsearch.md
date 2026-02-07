# dirsearch

> Web path scanner with recursive brute forcing and smart features.

## Quickstart

```bash
# Basic scan
dirsearch -u https://target.com

# Custom wordlist
dirsearch -u https://target.com -w wordlist.txt

# With extensions
dirsearch -u https://target.com -e php,asp,html

# Recursive scan
dirsearch -u https://target.com -r
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Recursive | Auto-scan discovered directories |
| Extensions | Append extensions to wordlist entries |
| Exclude | Filter by status, size, content |
| Threads | Parallel requests |

## Syntax

```text
dirsearch -u <url> [options]
dirsearch -l <file> [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL |
| `-l <file>` | URL list |
| `-e <ext>` | Extensions |
| `-w <file>` | Wordlist |

### Scanning

| Option | Description |
|--------|-------------|
| `-r` | Recursive scan |
| `-R <n>` | Recursion depth |
| `--deep-recursive` | Brute-force each path level |
| `-f` | Force extensions on every word |
| `-t <n>` | Threads (default 25) |
| `--random-agent` | Random user agent |

### Filters

| Option | Description |
|--------|-------------|
| `-i <codes>` | Include status codes |
| `-x <codes>` | Exclude status codes |
| `--exclude-sizes <s>` | Exclude response sizes |
| `--exclude-texts <t>` | Exclude by text content |
| `--min-response-size <n>` | Min response size |
| `--max-response-size <n>` | Max response size |

### Request

| Option | Description |
|--------|-------------|
| `-H <header>` | Custom header |
| `--cookie <c>` | Cookie string |
| `--user-agent <ua>` | User agent |
| `--proxy <url>` | Proxy |
| `-m <method>` | HTTP method |
| `--data <data>` | POST data |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `--format <fmt>` | Output format (json, xml, md, csv) |
| `-q` | Quiet mode |
| `--full-url` | Print full URLs |

## Recipes

### Basic Scanning

```bash
# Default scan
dirsearch -u https://target.com

# Custom wordlist
dirsearch -u https://target.com -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt

# Multiple targets
dirsearch -l urls.txt

# Fast scan
dirsearch -u https://target.com -t 50
```

### Extension Scanning

```bash
# PHP site
dirsearch -u https://target.com -e php

# Multiple extensions
dirsearch -u https://target.com -e php,asp,aspx,jsp,txt,bak,old

# Force extensions on all words
dirsearch -u https://target.com -e php -f
```

### Recursive Scanning

```bash
# Enable recursion
dirsearch -u https://target.com -r

# With depth limit
dirsearch -u https://target.com -r -R 3

# Deep recursive
dirsearch -u https://target.com --deep-recursive
```

### Filtering Results

```bash
# Only 200 and 301
dirsearch -u https://target.com -i 200,301

# Exclude 404 and 403
dirsearch -u https://target.com -x 404,403

# Exclude by size
dirsearch -u https://target.com --exclude-sizes 0B,1234B

# Exclude by content
dirsearch -u https://target.com --exclude-texts "Not Found"
```

### With Authentication

```bash
# Cookie auth
dirsearch -u https://target.com --cookie "session=abc123"

# Header auth
dirsearch -u https://target.com -H "Authorization: Bearer token"

# Custom headers
dirsearch -u https://target.com -H "X-Custom: value" -H "Another: header"
```

### Through Proxy

```bash
# Burp/Caido proxy
dirsearch -u https://target.com --proxy http://127.0.0.1:8080

# SOCKS proxy
dirsearch -u https://target.com --proxy socks5://127.0.0.1:1080
```

### Stealth Mode

```bash
# Random user agent
dirsearch -u https://target.com --random-agent

# With delay
dirsearch -u https://target.com --delay 0.5

# Reduced threads
dirsearch -u https://target.com -t 5 --delay 1
```

### Scan Specific Paths

```bash
# Start from specific path
dirsearch -u https://target.com/api/

# Scan subdirectory
dirsearch -u https://target.com/admin/ -r
```

## Output & Parsing

```bash
# JSON output
dirsearch -u https://target.com --format json -o results.json

# Markdown report
dirsearch -u https://target.com --format md -o report.md

# CSV
dirsearch -u https://target.com --format csv -o results.csv

# Full URLs
dirsearch -u https://target.com --full-url -o urls.txt

# Parse JSON
cat results.json | jq '.results[] | select(.status == 200) | .url'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too slow | Increase `-t`, check network |
| Rate limited | Add `--delay`, reduce `-t` |
| False positives | Use `--exclude-sizes`, `--exclude-texts` |
| SSL errors | Add `--skip-tls-verify` |

## References

- [dirsearch GitHub](https://github.com/maurosoria/dirsearch)
