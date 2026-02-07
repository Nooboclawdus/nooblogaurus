# gobuster

> Directory/file brute force and DNS/vhost enumeration tool.

## Quickstart

```bash
# Directory brute force
gobuster dir -u https://target.com -w wordlist.txt

# DNS subdomain brute force
gobuster dns -d target.com -w wordlist.txt

# Virtual host discovery
gobuster vhost -u https://target.com -w wordlist.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Modes | dir, dns, vhost, fuzz, s3, gcs, tftp |
| Wordlist | Dictionary for brute forcing |
| Extensions | Append extensions to words |

## Syntax

```text
gobuster <mode> [options]
```

## Options

### Global

| Option | Description |
|--------|-------------|
| `-w <file>` | Wordlist |
| `-t <n>` | Threads (default 10) |
| `-o <file>` | Output file |
| `-q` | Quiet mode |
| `-v` | Verbose |
| `--no-color` | Disable colors |
| `--delay <ms>` | Delay between requests |

### Dir Mode

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL |
| `-x <ext>` | Extensions (`.php,.txt,.bak`) |
| `-s <codes>` | Show status codes |
| `-b <codes>` | Hide status codes |
| `-r` | Follow redirects |
| `-k` | Skip TLS verify |
| `-c <cookie>` | Cookie string |
| `-H <header>` | Custom header |
| `-a <ua>` | User agent |
| `-P <proxy>` | Proxy URL |
| `-n` | No status codes |
| `-e` | Print full URLs |
| `-f` | Append / to dirs |
| `--exclude-length <n>` | Exclude by length |

### DNS Mode

| Option | Description |
|--------|-------------|
| `-d <domain>` | Target domain |
| `-r <resolver>` | DNS resolver |
| `-c` | Show CNAME |
| `-i` | Show IPs |

### VHost Mode

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL |
| `--append-domain` | Append domain to words |
| `--exclude-length <n>` | Exclude by length |

## Recipes

### Directory Brute Force

```bash
# Basic scan
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt

# With extensions
gobuster dir -u https://target.com -w wordlist.txt -x php,txt,html,bak

# Multiple extensions
gobuster dir -u https://target.com -w wordlist.txt -x php,asp,aspx,jsp,txt,bak,old,zip

# Fast scan
gobuster dir -u https://target.com -w wordlist.txt -t 50

# Follow redirects
gobuster dir -u https://target.com -w wordlist.txt -r

# Hide specific codes
gobuster dir -u https://target.com -w wordlist.txt -b 404,403

# Through proxy
gobuster dir -u https://target.com -w wordlist.txt -P http://127.0.0.1:8080
```

### DNS Enumeration

```bash
# Basic subdomain brute force
gobuster dns -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Show IPs
gobuster dns -d target.com -w wordlist.txt -i

# Show CNAMEs
gobuster dns -d target.com -w wordlist.txt -c

# Custom resolver
gobuster dns -d target.com -w wordlist.txt -r 8.8.8.8

# Full output
gobuster dns -d target.com -w wordlist.txt -i -c -o subs.txt
```

### Virtual Host Discovery

```bash
# Basic vhost scan
gobuster vhost -u https://10.10.10.10 -w wordlist.txt

# Append domain
gobuster vhost -u https://10.10.10.10 -w wordlist.txt --append-domain -d target.com

# Filter by length
gobuster vhost -u https://10.10.10.10 -w wordlist.txt --exclude-length 301
```

### With Authentication

```bash
# Basic auth
gobuster dir -u https://target.com -w wordlist.txt -U admin -P password

# Cookie auth
gobuster dir -u https://target.com -w wordlist.txt -c "session=abc123"

# Header auth
gobuster dir -u https://target.com -w wordlist.txt -H "Authorization: Bearer token"
```

### Filtering Results

```bash
# Only show 200s
gobuster dir -u https://target.com -w wordlist.txt -s 200

# Exclude 404 and 403
gobuster dir -u https://target.com -w wordlist.txt -b 404,403

# Exclude by response length
gobuster dir -u https://target.com -w wordlist.txt --exclude-length 1234

# Negative status (blacklist)
gobuster dir -u https://target.com -w wordlist.txt -b 404,403,500
```

### Pattern Matching

```bash
# Pattern file (for variables)
echo '{GOBUSTER}/admin' > patterns.txt
gobuster dir -u https://target.com -w wordlist.txt -p patterns.txt
```

## Output & Parsing

```bash
# Save output
gobuster dir -u https://target.com -w wordlist.txt -o results.txt

# Expanded URLs
gobuster dir -u https://target.com -w wordlist.txt -e -o full_urls.txt

# Parse output
cat results.txt | grep "Status: 200" | awk '{print $1}'

# JSON output (not native, use grep)
gobuster dir -u https://target.com -w wordlist.txt | \
  grep "Status:" | while read line; do
    echo "{\"path\":\"$(echo $line | awk '{print $1}')\",\"status\":\"$(echo $line | awk '{print $3}')\"}"
  done
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too slow | Increase `-t` threads |
| Rate limited | Add `--delay`, reduce `-t` |
| SSL errors | Add `-k` flag |
| Wildcard DNS | Use `--wildcard` for dns mode |

## References

- [gobuster GitHub](https://github.com/OJ/gobuster)
