# httpx

> Fast HTTP prober for identifying live hosts, tech stack, and grabbing responses. ProjectDiscovery.

## Quickstart

```bash
# Probe list of hosts
cat hosts.txt | httpx

# With tech detection and status codes
cat hosts.txt | httpx -sc -title -tech-detect

# Full recon mode
cat hosts.txt | httpx -sc -title -tech-detect -server -cdn -ip -cname -o results.txt

# From subfinder
subfinder -d target.com -silent | httpx -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Probing | Check if HTTP/HTTPS is alive |
| Tech detect | Identify technologies (Wappalyzer-based) |
| Matchers | Filter by status, content, size |
| Output | JSON, CSV, or custom format |

## Syntax

```text
httpx [options] -u <url>
cat hosts.txt | httpx [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-u <url>` | Single URL |
| `-l <file>` | List of hosts/URLs |
| `-` | Read from stdin (pipe) |

### Probes

| Option | Description |
|--------|-------------|
| `-sc` | Show status code |
| `-title` | Show page title |
| `-server` | Show server header |
| `-tech-detect` | Detect technologies |
| `-ip` | Show IP address |
| `-cname` | Show CNAME record |
| `-cdn` | Check if CDN |
| `-hash <type>` | Response body hash (md5, sha256) |
| `-jarm` | JARM fingerprint |

### Request Options

| Option | Description |
|--------|-------------|
| `-method <m>` | HTTP method (GET, POST, etc.) |
| `-H "Header: val"` | Custom header |
| `-body <data>` | Request body |
| `-path <path>` | Path to probe |
| `-x <proxy>` | HTTP proxy |
| `-timeout <sec>` | Timeout (default 15s) |
| `-retries <n>` | Number of retries |
| `-follow-redirects` | Follow redirects |
| `-max-redirects <n>` | Max redirects to follow |

### Matchers/Filters

| Option | Description |
|--------|-------------|
| `-mc <codes>` | Match status codes |
| `-fc <codes>` | Filter status codes |
| `-ms <size>` | Match response size |
| `-fs <size>` | Filter response size |
| `-ml <lines>` | Match line count |
| `-fl <lines>` | Filter line count |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-json` | JSON output |
| `-csv` | CSV output |
| `-silent` | Silent mode |
| `-no-color` | Disable colors |
| `-v` | Verbose |

### Performance

| Option | Description |
|--------|-------------|
| `-threads <n>` | Threads (default 50) |
| `-rate-limit <n>` | Requests per second |
| `-rl <n>` | Rate limit per host |

## Recipes

### Basic Probing

```bash
# Check single host
httpx -u https://target.com

# Probe list
httpx -l hosts.txt

# From stdin
cat hosts.txt | httpx

# Silent output (URLs only)
cat hosts.txt | httpx -silent
```

### Recon Pipeline

```bash
# Full recon info
cat hosts.txt | httpx -sc -title -tech-detect -server -ip -cdn

# Save as JSON
cat hosts.txt | httpx -sc -title -tech-detect -json -o results.json

# CSV output
cat hosts.txt | httpx -sc -title -server -csv -o results.csv
```

### Tech Detection

```bash
# Detect tech stack
cat hosts.txt | httpx -tech-detect

# Tech with details
cat hosts.txt | httpx -tech-detect -title -server

# Filter by tech (grep output)
cat hosts.txt | httpx -tech-detect -silent | grep -i wordpress
```

### Status Code Filtering

```bash
# Only show 200s
cat hosts.txt | httpx -mc 200

# Exclude 404s
cat hosts.txt | httpx -fc 404

# Find 401/403 (potential auth bypass)
cat hosts.txt | httpx -mc 401,403 -sc -title

# Find redirects
cat hosts.txt | httpx -mc 301,302,307,308 -location
```

### Content Discovery

```bash
# Probe paths
cat hosts.txt | httpx -path /admin -sc -title
cat hosts.txt | httpx -path /api/v1 -sc

# Multiple paths
for path in /admin /login /api; do
  cat hosts.txt | httpx -path $path -sc -title
done
```

### Integration with Other Tools

```bash
# Subfinder → httpx
subfinder -d target.com -silent | httpx -silent -o live.txt

# Amass → httpx
amass enum -d target.com | httpx -silent

# Naabu → httpx
naabu -host target.com -silent | httpx -silent

# httpx → nuclei
cat hosts.txt | httpx -silent | nuclei -t cves/
```

### Screenshot + Response

```bash
# Store response
cat hosts.txt | httpx -sr -srd ./responses

# Store response with body hash
cat hosts.txt | httpx -sr -srd ./responses -hash md5
```

### Custom Requests

```bash
# POST request
cat hosts.txt | httpx -method POST -body '{"test":1}'

# Custom headers
cat hosts.txt | httpx -H "Authorization: Bearer token123"

# Through proxy
cat hosts.txt | httpx -x http://127.0.0.1:8080
```

## Output & Parsing

```bash
# JSON output
cat hosts.txt | httpx -json -o results.json

# Parse JSON
cat results.json | jq -r 'select(.status_code == 200) | .url'

# CSV for spreadsheets
cat hosts.txt | httpx -sc -title -tech-detect -csv -o results.csv

# Custom output format
cat hosts.txt | httpx -sc -title -o results.txt
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too slow | Increase `-threads`, add `-rate-limit` |
| Connection errors | Check `-timeout`, add `-retries` |
| SSL errors | Add `-no-verify` (careful!) |
| Missing results | Check stdin, try `-v` for debug |

## References

- [httpx GitHub](https://github.com/projectdiscovery/httpx)
- [httpx Docs](https://docs.projectdiscovery.io/tools/httpx/overview)
