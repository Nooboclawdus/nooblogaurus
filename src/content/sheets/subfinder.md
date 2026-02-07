# subfinder

> Fast subdomain discovery tool using passive sources. ProjectDiscovery.

## Quickstart

```bash
# Find subdomains
subfinder -d target.com

# Silent output (clean list)
subfinder -d target.com -silent

# Multiple domains
subfinder -dL domains.txt -silent

# Pipe to httpx
subfinder -d target.com -silent | httpx -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Passive sources | APIs like Shodan, Censys, VirusTotal |
| Provider config | API keys in `~/.config/subfinder/provider-config.yaml` |
| Recursive | Find subdomains of subdomains |

## Syntax

```text
subfinder -d <domain> [options]
subfinder -dL <file> [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-d <domain>` | Single domain |
| `-dL <file>` | List of domains |

### Sources

| Option | Description |
|--------|-------------|
| `-s <sources>` | Use specific sources |
| `-es <sources>` | Exclude sources |
| `-all` | Use all sources |
| `-ls` | List available sources |
| `-recursive` | Recursive subdomain discovery |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-oJ` | JSON output |
| `-oD <dir>` | Output directory (per domain) |
| `-silent` | Silent mode (subdomains only) |
| `-v` | Verbose |
| `-nc` | No color |

### Performance

| Option | Description |
|--------|-------------|
| `-t <n>` | Threads (default 10) |
| `-timeout <sec>` | Timeout |
| `-rl <n>` | Rate limit |
| `-max-time <min>` | Max time per domain |

### Config

| Option | Description |
|--------|-------------|
| `-config <file>` | Config file path |
| `-pc <file>` | Provider config path |

## Recipes

### Basic Discovery

```bash
# Single domain
subfinder -d target.com

# Clean output
subfinder -d target.com -silent

# Multiple domains
subfinder -dL domains.txt -silent -o all_subs.txt

# Verbose (see sources)
subfinder -d target.com -v
```

### Source Management

```bash
# List sources
subfinder -ls

# Use specific sources
subfinder -d target.com -s shodan,censys,virustotal

# Exclude slow sources
subfinder -d target.com -es github

# Use all sources (slower, more results)
subfinder -d target.com -all
```

### Recursive Discovery

```bash
# Find subs of subs
subfinder -d target.com -recursive

# With depth limit (via multiple runs)
subfinder -d target.com -silent | \
  xargs -I {} subfinder -d {} -silent | sort -u
```

### Pipeline Integration

```bash
# subfinder → httpx
subfinder -d target.com -silent | httpx -silent

# subfinder → httpx → nuclei
subfinder -d target.com -silent | httpx -silent | nuclei -silent

# subfinder → dnsx (resolve)
subfinder -d target.com -silent | dnsx -silent

# Multiple domains pipeline
subfinder -dL domains.txt -silent | httpx -silent -o live.txt
```

### Output Formats

```bash
# JSON output
subfinder -d target.com -oJ -o subs.json

# Per-domain output files
subfinder -dL domains.txt -oD ./results/

# Append to file
subfinder -d target.com -silent >> all_subs.txt
```

### Provider Config

```yaml
# ~/.config/subfinder/provider-config.yaml
shodan:
  - YOUR_SHODAN_API_KEY
censys:
  - YOUR_CENSYS_API_KEY
virustotal:
  - YOUR_VT_API_KEY
chaos:
  - YOUR_CHAOS_API_KEY
```

```bash
# Use custom config
subfinder -d target.com -pc /path/to/provider-config.yaml
```

## Output & Parsing

```bash
# Clean list
subfinder -d target.com -silent > subs.txt

# JSON parsing
subfinder -d target.com -oJ | jq -r '.host'

# Count subdomains
subfinder -d target.com -silent | wc -l

# Sort unique
subfinder -d target.com -silent | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Few results | Add API keys to provider config |
| Timeout errors | Increase `-timeout`, reduce sources |
| Rate limited | Add `-rl`, use fewer sources |
| No results | Check domain, try `-all` |

## References

- [subfinder GitHub](https://github.com/projectdiscovery/subfinder)
- [subfinder Docs](https://docs.projectdiscovery.io/tools/subfinder/overview)
