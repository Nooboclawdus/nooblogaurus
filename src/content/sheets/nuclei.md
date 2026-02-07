# nuclei

> Template-based vulnerability scanner. Fast, customizable, and community-driven. ProjectDiscovery.

## Quickstart

```bash
# Scan single target with all templates
nuclei -u https://target.com

# Scan with specific templates
nuclei -u https://target.com -t cves/

# Scan list of URLs
nuclei -l urls.txt

# Update templates
nuclei -ut
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Templates | YAML files defining vulnerability checks |
| Tags | Categories like `cve`, `rce`, `xss`, `sqli` |
| Severity | info, low, medium, high, critical |
| Workflows | Chain multiple templates together |

## Syntax

```text
nuclei -u <url> [options]
nuclei -l <file> [options]
cat urls.txt | nuclei [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-u <url>` | Single target URL |
| `-l <file>` | List of URLs |
| `-` | Read from stdin |
| `-resume <file>` | Resume scan from file |

### Templates

| Option | Description |
|--------|-------------|
| `-t <path>` | Template path/directory |
| `-tl` | List available templates |
| `-tags <tags>` | Filter by tags |
| `-etags <tags>` | Exclude tags |
| `-s <severity>` | Filter by severity |
| `-es <severity>` | Exclude severity |
| `-author <name>` | Filter by author |
| `-nt` | New templates only |
| `-ut` | Update templates |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-json` | JSON output |
| `-jsonl` | JSON lines output |
| `-silent` | Silent mode |
| `-nc` | No color |
| `-v` | Verbose |
| `-debug` | Debug mode |

### Performance

| Option | Description |
|--------|-------------|
| `-c <n>` | Concurrent templates (default 25) |
| `-rl <n>` | Rate limit per second |
| `-bs <n>` | Bulk size (hosts per template) |
| `-timeout <sec>` | Timeout |
| `-retries <n>` | Retries |

### Interactsh (OOB)

| Option | Description |
|--------|-------------|
| `-iserver <url>` | Interactsh server |
| `-itoken <token>` | Interactsh token |
| `-ni` | Disable interactsh |

### Misc

| Option | Description |
|--------|-------------|
| `-H "Header: val"` | Custom header |
| `-proxy <url>` | HTTP proxy |
| `-fr` | Follow redirects |
| `-ss` | Screenshot on match |

## Recipes

### Basic Scanning

```bash
# Scan single target
nuclei -u https://target.com

# Scan URL list
nuclei -l urls.txt

# From stdin
cat urls.txt | nuclei

# Silent output
nuclei -u https://target.com -silent
```

### Template Selection

```bash
# Specific template
nuclei -u https://target.com -t cves/2023/CVE-2023-1234.yaml

# Template directory
nuclei -u https://target.com -t cves/

# By tags
nuclei -u https://target.com -tags cve,rce
nuclei -u https://target.com -tags xss,sqli

# By severity
nuclei -u https://target.com -s critical,high
nuclei -u https://target.com -s medium,low,info

# Exclude tags
nuclei -u https://target.com -etags dos,fuzz

# Exclude severity
nuclei -u https://target.com -es info
```

### Common Scan Types

```bash
# CVE scanning
nuclei -l urls.txt -t cves/

# Technology detection
nuclei -l urls.txt -t technologies/

# Exposed panels
nuclei -l urls.txt -t exposed-panels/

# Misconfigurations
nuclei -l urls.txt -t misconfiguration/

# Default logins
nuclei -l urls.txt -t default-logins/

# Takeovers
nuclei -l urls.txt -t takeovers/

# Exposures (tokens, keys)
nuclei -l urls.txt -t exposures/
```

### Full Recon Scan

```bash
# All templates, high/critical only
nuclei -l urls.txt -s high,critical -o critical_findings.txt

# Full scan with JSON
nuclei -l urls.txt -json -o results.json

# Exclude noisy stuff
nuclei -l urls.txt -etags dos,fuzz -es info -o findings.txt
```

### Integration Pipeline

```bash
# Subfinder → httpx → nuclei
subfinder -d target.com -silent | httpx -silent | nuclei -t cves/

# katana → nuclei
katana -u https://target.com -silent | nuclei -silent

# Full pipeline
subfinder -d target.com -silent | \
  httpx -silent | \
  nuclei -s high,critical -o vulns.txt
```

### Custom Templates

```bash
# Use custom template
nuclei -u https://target.com -t /path/to/custom.yaml

# Validate template
nuclei -t custom.yaml -validate

# Template with proxy for debugging
nuclei -u https://target.com -t custom.yaml -proxy http://127.0.0.1:8080
```

### Rate Limiting & Stealth

```bash
# Rate limited scan
nuclei -l urls.txt -rl 10 -c 5

# With delays
nuclei -l urls.txt -rl 5 -c 2

# Through proxy
nuclei -l urls.txt -proxy http://127.0.0.1:8080
```

### Template Management

```bash
# Update templates
nuclei -ut

# List all templates
nuclei -tl

# List templates by tag
nuclei -tl -tags cve

# Show new templates
nuclei -nt -tl
```

## Output & Parsing

```bash
# JSON output
nuclei -l urls.txt -json -o results.json

# Parse JSON results
cat results.json | jq -r 'select(.info.severity == "high") | .host'

# JSONL for streaming
nuclei -l urls.txt -jsonl -o results.jsonl

# Markdown report
nuclei -l urls.txt -me report/
```

## Custom Template Structure

```yaml
id: custom-check

info:
  name: Custom Vulnerability Check
  author: yourname
  severity: medium
  tags: custom

requests:
  - method: GET
    path:
      - "{{BaseURL}}/admin"
    matchers:
      - type: status
        status:
          - 200
      - type: word
        words:
          - "admin panel"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results | Check templates exist, try `-v` |
| Too slow | Reduce `-c`, check network |
| Rate limited | Add `-rl`, reduce concurrency |
| OOB not working | Check interactsh server, use `-debug` |
| Template errors | Run with `-validate` |

## References

- [nuclei GitHub](https://github.com/projectdiscovery/nuclei)
- [nuclei Templates](https://github.com/projectdiscovery/nuclei-templates)
- [nuclei Docs](https://docs.projectdiscovery.io/tools/nuclei/overview)
