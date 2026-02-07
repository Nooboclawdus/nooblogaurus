# dnsrecon

> DNS enumeration script with multiple techniques.

## Quickstart

```bash
# Standard enumeration
dnsrecon -d target.com

# Brute force subdomains
dnsrecon -d target.com -t brt -D wordlist.txt

# Zone transfer
dnsrecon -d target.com -t axfr

# All enumeration types
dnsrecon -d target.com -a
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Enumeration | Multiple DNS recon techniques |
| Zone transfer | Attempt AXFR |
| Brute force | Subdomain dictionary attack |
| Reverse | PTR lookups |

## Syntax

```text
dnsrecon -d <domain> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-d <domain>` | Target domain |
| `-r <range>` | IP range for reverse lookup |
| `-n <ns>` | Name server to use |

### Enumeration Types

| Option | Description |
|--------|-------------|
| `-t std` | Standard enum |
| `-t brt` | Brute force |
| `-t axfr` | Zone transfer |
| `-t rvl` | Reverse lookup |
| `-t srv` | SRV records |
| `-t zonewalk` | NSEC zone walk |
| `-a` | All enum types |

### Brute Force

| Option | Description |
|--------|-------------|
| `-D <file>` | Dictionary file |
| `-f` | Filter wildcard |

### Output

| Option | Description |
|--------|-------------|
| `-c <file>` | CSV output |
| `-j <file>` | JSON output |
| `-x <file>` | XML output |
| `--db <file>` | SQLite database |

### Performance

| Option | Description |
|--------|-------------|
| `--threads <n>` | Threads |
| `--lifetime <sec>` | Query timeout |

## Recipes

### Standard Enumeration

```bash
# Basic enum
dnsrecon -d target.com

# All techniques
dnsrecon -d target.com -a

# Verbose
dnsrecon -d target.com -v
```

### Zone Transfer

```bash
# Try zone transfer
dnsrecon -d target.com -t axfr

# Against specific NS
dnsrecon -d target.com -t axfr -n ns1.target.com
```

### Subdomain Brute Force

```bash
# With wordlist
dnsrecon -d target.com -t brt -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Filter wildcards
dnsrecon -d target.com -t brt -D wordlist.txt -f

# Multi-threaded
dnsrecon -d target.com -t brt -D wordlist.txt --threads 50
```

### Reverse Lookup

```bash
# IP range reverse lookup
dnsrecon -r 10.10.10.0/24

# Reverse lookup enumeration
dnsrecon -d target.com -t rvl
```

### SRV Records

```bash
# Find SRV records
dnsrecon -d target.com -t srv

# Common SRV records found:
# _ldap, _kerberos, _sip, _xmpp
```

### NSEC Zone Walk

```bash
# DNSSEC zone walk (if NSEC used)
dnsrecon -d target.com -t zonewalk
```

### Output Formats

```bash
# CSV output
dnsrecon -d target.com -c results.csv

# JSON output
dnsrecon -d target.com -j results.json

# XML output
dnsrecon -d target.com -x results.xml

# SQLite database
dnsrecon -d target.com --db results.db
```

### Custom Name Server

```bash
# Use specific resolver
dnsrecon -d target.com -n 8.8.8.8

# Use target's NS
dnsrecon -d target.com -n ns1.target.com
```

### Pipeline Integration

```bash
# Parse CSV output
dnsrecon -d target.com -c results.csv
cat results.csv | cut -d',' -f2 | tail -n +2 | sort -u

# JSON parsing
dnsrecon -d target.com -j results.json
cat results.json | jq -r '.[].name'

# Feed to httpx
dnsrecon -d target.com -j - 2>/dev/null | jq -r '.[].name' | httpx -silent
```

## Output & Parsing

```bash
# JSON parsing
dnsrecon -d target.com -j results.json
cat results.json | jq -r '.[].name' | sort -u

# CSV parsing
dnsrecon -d target.com -c results.csv
awk -F',' '{print $2}' results.csv | tail -n +2 | sort -u

# Extract IPs
cat results.json | jq -r '.[].address' | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Zone transfer fails | Expected (most block it) |
| Slow brute force | Reduce wordlist, increase threads |
| Wildcard responses | Use `-f` to filter |
| Timeout | Increase `--lifetime` |

## References

- [dnsrecon GitHub](https://github.com/darkoperator/dnsrecon)
