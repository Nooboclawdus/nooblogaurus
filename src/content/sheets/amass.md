# amass

> Attack surface mapping and asset discovery. OWASP project.

## Quickstart

```bash
# Passive enum (fast, no direct contact)
amass enum -passive -d target.com

# Active enum (DNS brute force)
amass enum -d target.com

# With config (API keys)
amass enum -d target.com -config config.ini

# Intel mode (find related domains)
amass intel -d target.com
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| enum | Subdomain enumeration |
| intel | OSINT/related domain discovery |
| passive | No direct target contact |
| active | DNS brute force, zone transfers |

## Syntax

```text
amass enum [options] -d <domain>
amass intel [options] -d <domain>
```

## Options

### Enum Mode

| Option | Description |
|--------|-------------|
| `-d <domain>` | Target domain |
| `-df <file>` | Domains file |
| `-passive` | Passive only (no brute force) |
| `-active` | Active techniques |
| `-brute` | Brute force subdomain names |
| `-w <file>` | Wordlist for brute force |
| `-ip` | Show IP addresses |
| `-ipv4` | IPv4 only |
| `-ipv6` | IPv6 only |
| `-src` | Show data sources |
| `-o <file>` | Output file |
| `-oA <base>` | All output formats |
| `-json <file>` | JSON output |
| `-config <file>` | Config file |

### Intel Mode

| Option | Description |
|--------|-------------|
| `-d <domain>` | Target domain |
| `-org <name>` | Organization name |
| `-asn <asn>` | ASN number |
| `-whois` | Use WHOIS |
| `-ip <ip>` | Search by IP |
| `-cidr <cidr>` | Search by CIDR |

### Performance

| Option | Description |
|--------|-------------|
| `-timeout <min>` | Timeout in minutes |
| `-max-dns-queries <n>` | Max DNS queries |
| `-rf <file>` | Resolvers file |

## Recipes

### Passive Enumeration

```bash
# Fast passive scan
amass enum -passive -d target.com

# With IP addresses
amass enum -passive -d target.com -ip

# Show sources
amass enum -passive -d target.com -src

# Multiple domains
amass enum -passive -df domains.txt
```

### Active Enumeration

```bash
# Full enumeration
amass enum -d target.com

# With brute force
amass enum -brute -d target.com

# Custom wordlist
amass enum -brute -w wordlist.txt -d target.com

# Active techniques
amass enum -active -d target.com
```

### Intel Mode

```bash
# Related domains
amass intel -d target.com

# By organization
amass intel -org "Target Company"

# By ASN
amass intel -asn 12345

# By IP/CIDR
amass intel -ip 10.10.10.10
amass intel -cidr 10.10.10.0/24

# WHOIS
amass intel -whois -d target.com
```

### Output Formats

```bash
# Text output
amass enum -passive -d target.com -o subs.txt

# JSON output
amass enum -passive -d target.com -json results.json

# All formats
amass enum -passive -d target.com -oA results

# Creates: results.txt, results.json
```

### With Config (API Keys)

```ini
# config.ini
[data_sources]

[data_sources.Shodan]
apikey = YOUR_SHODAN_KEY

[data_sources.Censys]
apikey = YOUR_CENSYS_ID
secret = YOUR_CENSYS_SECRET

[data_sources.VirusTotal]
apikey = YOUR_VT_KEY

[data_sources.SecurityTrails]
apikey = YOUR_ST_KEY
```

```bash
# Use config
amass enum -d target.com -config config.ini
```

### Pipeline Integration

```bash
# amass → httpx
amass enum -passive -d target.com -o subs.txt
cat subs.txt | httpx -silent

# amass → naabu → httpx
amass enum -passive -d target.com | naabu -silent | httpx -silent

# Full pipeline
amass enum -passive -d target.com | \
  httpx -silent | \
  nuclei -t cves/
```

### Custom Resolvers

```bash
# Use trusted resolvers
amass enum -d target.com -rf resolvers.txt

# resolvers.txt example:
# 8.8.8.8
# 1.1.1.1
# 9.9.9.9
```

### Database

```bash
# Amass stores results in database
# List collected domains
amass db -names -d target.com

# Show graph
amass viz -d target.com -d3

# Track changes over time
amass track -d target.com
```

## Output & Parsing

```bash
# JSON parsing
amass enum -passive -d target.com -json results.json
cat results.json | jq -r '.name'

# Count subdomains
amass enum -passive -d target.com | wc -l

# Unique sorted
amass enum -passive -d target.com | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow/no results | Use `-passive`, add API keys |
| DNS errors | Use custom resolvers `-rf` |
| Rate limited | Add `-max-dns-queries` |
| Timeout | Increase `-timeout` |

## References

- [OWASP Amass](https://owasp.org/www-project-amass/)
- [Amass GitHub](https://github.com/owasp-amass/amass)
- [Amass User Guide](https://github.com/owasp-amass/amass/blob/master/doc/user_guide.md)
