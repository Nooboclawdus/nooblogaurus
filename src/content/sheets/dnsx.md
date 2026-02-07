# dnsx

> Fast DNS toolkit for queries, resolution, and wildcard detection. ProjectDiscovery.

## Quickstart

```bash
# Resolve subdomains
cat subs.txt | dnsx -silent

# A records
cat subs.txt | dnsx -a -silent

# All records
cat subs.txt | dnsx -a -aaaa -cname -mx -txt -silent

# Reverse DNS
cat ips.txt | dnsx -ptr -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Resolution | Resolve domains to IPs |
| Record types | A, AAAA, CNAME, MX, TXT, NS, PTR |
| Wildcard | Detect and filter wildcard DNS |
| Brute force | DNS subdomain bruteforce |

## Syntax

```text
dnsx [options] -d <domain>
cat domains.txt | dnsx [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-d <domain>` | Single domain |
| `-l <file>` | Domain list |
| `-` | Read from stdin |
| `-w <file>` | Wordlist for brute force |

### Record Types

| Option | Description |
|--------|-------------|
| `-a` | A records |
| `-aaaa` | AAAA records |
| `-cname` | CNAME records |
| `-mx` | MX records |
| `-ns` | NS records |
| `-txt` | TXT records |
| `-ptr` | PTR (reverse DNS) |
| `-soa` | SOA records |
| `-any` | ANY query |
| `-axfr` | Zone transfer |

### Output

| Option | Description |
|--------|-------------|
| `-resp` | Show response |
| `-ro` | Response only |
| `-json` | JSON output |
| `-o <file>` | Output file |
| `-silent` | Silent mode |
| `-v` | Verbose |

### Filtering

| Option | Description |
|--------|-------------|
| `-wd` | Wildcard detection |
| `-wt <n>` | Wildcard threshold |
| `-rc <codes>` | Response codes |

### Performance

| Option | Description |
|--------|-------------|
| `-t <n>` | Threads (default 100) |
| `-rl <n>` | Rate limit |
| `-retry <n>` | Retries |
| `-r <resolvers>` | Custom resolvers |
| `-rL <file>` | Resolver list |

## Recipes

### Basic Resolution

```bash
# Resolve domains
cat subs.txt | dnsx -silent

# With A records shown
cat subs.txt | dnsx -a -resp

# Multiple record types
cat subs.txt | dnsx -a -cname -resp
```

### Record Enumeration

```bash
# A records
cat subs.txt | dnsx -a -resp -silent

# CNAME (find CDN, third-party)
cat subs.txt | dnsx -cname -resp -silent

# MX records (mail servers)
echo target.com | dnsx -mx -resp

# TXT records (SPF, DKIM, verification)
echo target.com | dnsx -txt -resp

# NS records
echo target.com | dnsx -ns -resp

# All common records
cat subs.txt | dnsx -a -aaaa -cname -mx -txt -ns -resp
```

### Reverse DNS

```bash
# PTR lookup
cat ips.txt | dnsx -ptr -resp -silent

# From nmap output
grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' nmap.txt | dnsx -ptr -silent
```

### DNS Brute Force

```bash
# Subdomain brute force
dnsx -d target.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -silent

# With response
dnsx -d target.com -w wordlist.txt -a -resp
```

### Wildcard Handling

```bash
# Detect wildcards
cat subs.txt | dnsx -wd -silent

# Filter wildcards
cat subs.txt | dnsx -wd -silent | grep -v "wildcard"
```

### Pipeline Integration

```bash
# subfinder → dnsx
subfinder -d target.com -silent | dnsx -silent

# Resolve and check HTTP
subfinder -d target.com -silent | dnsx -silent | httpx -silent

# Get IPs for port scanning
subfinder -d target.com -silent | dnsx -a -resp-only -silent | sort -u
```

### Custom Resolvers

```bash
# Use specific resolver
cat subs.txt | dnsx -r 8.8.8.8,1.1.1.1 -silent

# Use resolver file
cat subs.txt | dnsx -rL resolvers.txt -silent

# Trusted resolvers
cat subs.txt | dnsx -r 8.8.8.8,8.8.4.4,1.1.1.1,1.0.0.1 -silent
```

### Zone Transfer

```bash
# Attempt zone transfer (rare but check)
dnsx -d target.com -axfr
```

## Output & Parsing

```bash
# JSON output
cat subs.txt | dnsx -json -o results.json

# Response only (IPs)
cat subs.txt | dnsx -a -resp-only -silent

# Parse JSON
cat results.json | jq -r '.a[]'

# Unique IPs
cat subs.txt | dnsx -a -resp-only -silent | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow resolution | Increase `-t`, use fast resolvers |
| Timeouts | Add `-retry`, check resolvers |
| Wildcard false positives | Use `-wd` |
| Missing results | Try different resolvers |

## References

- [dnsx GitHub](https://github.com/projectdiscovery/dnsx)
- [dnsx Docs](https://docs.projectdiscovery.io/tools/dnsx/overview)
