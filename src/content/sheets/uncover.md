# uncover

> Search engine query tool for finding exposed assets. Shodan, Censys, Fofa, and more. ProjectDiscovery.

## Quickstart

```bash
# Shodan search
uncover -q "ssl.cert.subject.cn:target.com" -e shodan

# Censys search
uncover -q "target.com" -e censys

# Multiple engines
uncover -q "target.com" -e shodan,censys

# Pipe to httpx
uncover -q "org:target" -e shodan -silent | httpx -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Engines | Shodan, Censys, Fofa, Hunter, etc. |
| Queries | Engine-specific search syntax |
| API keys | Required in provider config |

## Syntax

```text
uncover -q <query> -e <engine> [options]
uncover -qf <file> -e <engine> [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-q <query>` | Search query |
| `-qf <file>` | Query file |
| `-e <engine>` | Engine (shodan, censys, fofa, etc.) |

### Engines

| Option | Description |
|--------|-------------|
| `shodan` | Shodan |
| `censys` | Censys |
| `fofa` | Fofa |
| `hunter` | Hunter.io |
| `quake` | Quake |
| `zoomeye` | ZoomEye |
| `netlas` | Netlas |
| `criminalip` | CriminalIP |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-json` | JSON output |
| `-f <fields>` | Output fields |
| `-silent` | Silent mode |
| `-v` | Verbose |
| `-nc` | No color |

### Limits

| Option | Description |
|--------|-------------|
| `-l <n>` | Limit results |
| `-timeout <sec>` | Timeout |

### Config

| Option | Description |
|--------|-------------|
| `-pc <file>` | Provider config |

## Recipes

### Shodan Queries

```bash
# SSL certificate CN
uncover -q "ssl.cert.subject.cn:target.com" -e shodan

# Organization
uncover -q "org:Target Inc" -e shodan

# ASN
uncover -q "asn:AS12345" -e shodan

# Product
uncover -q "product:nginx org:target" -e shodan

# Port + org
uncover -q "port:443 org:target" -e shodan

# HTTP title
uncover -q "http.title:admin org:target" -e shodan

# Favicon hash
uncover -q "http.favicon.hash:123456789" -e shodan
```

### Censys Queries

```bash
# Domain
uncover -q "services.tls.certificates.leaf_data.subject.common_name:target.com" -e censys

# Organization
uncover -q "autonomous_system.name:Target" -e censys

# Service
uncover -q "services.service_name:HTTP and labels:target" -e censys
```

### Multi-Engine Search

```bash
# All engines
uncover -q "target.com" -e shodan,censys,fofa

# Aggregate results
uncover -q "target.com" -e shodan,censys -silent | sort -u
```

### Pipeline Integration

```bash
# uncover → httpx
uncover -q "org:target" -e shodan -silent | httpx -silent

# uncover → naabu → httpx
uncover -q "org:target" -e shodan -silent | \
  naabu -silent | httpx -silent

# uncover → nuclei
uncover -q "ssl:target.com" -e shodan -silent | \
  httpx -silent | nuclei -t cves/

# Find and scan
uncover -q "http.title:Jenkins" -e shodan -l 100 -silent | \
  httpx -silent | nuclei -t technologies/jenkins-detect.yaml
```

### Find Specific Services

```bash
# Jenkins instances
uncover -q "http.title:Jenkins" -e shodan

# Elasticsearch
uncover -q "product:elastic port:9200" -e shodan

# MongoDB
uncover -q "product:mongodb port:27017" -e shodan

# Kubernetes API
uncover -q "kubernetes port:6443" -e shodan

# GitLab
uncover -q "http.title:GitLab" -e shodan
```

### Output Fields

```bash
# IP only
uncover -q "org:target" -e shodan -f ip -silent

# IP and port
uncover -q "org:target" -e shodan -f ip,port -silent

# JSON output
uncover -q "org:target" -e shodan -json -o results.json
```

### Provider Config

```yaml
# ~/.config/uncover/provider-config.yaml
shodan:
  - YOUR_SHODAN_API_KEY
censys:
  - YOUR_CENSYS_API_KEY
fofa:
  - YOUR_FOFA_EMAIL:YOUR_FOFA_KEY
```

## Output & Parsing

```bash
# JSON output
uncover -q "org:target" -e shodan -json -o results.json

# Parse JSON
cat results.json | jq -r '.ip + ":" + (.port|tostring)'

# Clean IP:port list
uncover -q "org:target" -e shodan -silent

# Unique IPs
uncover -q "org:target" -e shodan -f ip -silent | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results | Check API key, query syntax |
| Rate limited | Add delay, check API limits |
| Wrong engine | Verify engine name spelling |
| Auth error | Check provider config |

## References

- [uncover GitHub](https://github.com/projectdiscovery/uncover)
- [uncover Docs](https://docs.projectdiscovery.io/tools/uncover/overview)
- [Shodan Query Syntax](https://help.shodan.io/the-basics/search-query-fundamentals)
