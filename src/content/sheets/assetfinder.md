# assetfinder

> Fast subdomain discovery using passive sources. Simple and effective.

## Quickstart

```bash
# Find subdomains
assetfinder target.com

# Subdomains only (no related)
assetfinder --subs-only target.com

# Pipe to httpx
assetfinder --subs-only target.com | httpx -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Passive | Uses external data sources |
| Fast | Simple and quick results |
| Sources | crt.sh, certspotter, hackertarget, etc. |

## Syntax

```text
assetfinder [options] <domain>
```

## Options

| Option | Description |
|--------|-------------|
| `--subs-only` | Only subdomains (not related) |

## Recipes

### Basic Usage

```bash
# All assets (includes related domains)
assetfinder target.com

# Subdomains only
assetfinder --subs-only target.com

# Save to file
assetfinder --subs-only target.com > subs.txt
```

### Multiple Domains

```bash
# Loop through domains
for domain in $(cat domains.txt); do
  assetfinder --subs-only $domain
done | sort -u

# With cat and xargs
cat domains.txt | xargs -I {} assetfinder --subs-only {}
```

### Pipeline Integration

```bash
# assetfinder → httpx
assetfinder --subs-only target.com | httpx -silent

# assetfinder → dnsx
assetfinder --subs-only target.com | dnsx -silent

# Full pipeline
assetfinder --subs-only target.com | \
  httpx -silent | \
  nuclei -t cves/

# Combine with subfinder
(assetfinder --subs-only target.com; subfinder -d target.com -silent) | sort -u
```

### Filtering Results

```bash
# Unique sorted
assetfinder --subs-only target.com | sort -u

# Count
assetfinder --subs-only target.com | wc -l

# Filter specific patterns
assetfinder --subs-only target.com | grep -E "^(dev|staging|test)\."
```

## Output & Parsing

```bash
# Save to file
assetfinder --subs-only target.com > subs.txt

# Unique and sorted
assetfinder --subs-only target.com | sort -u > subs.txt

# One domain per line (default)
assetfinder --subs-only target.com
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results | Check domain, try different tool |
| Duplicates | Pipe through `sort -u` |
| Too many results | Use `--subs-only` |

## References

- [assetfinder GitHub](https://github.com/tomnomnom/assetfinder)
