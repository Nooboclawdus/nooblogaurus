# wafw00f

> Web Application Firewall (WAF) detection tool.

## Quickstart

```bash
# Detect WAF
wafw00f https://target.com

# List all supported WAFs
wafw00f -l

# Verbose mode
wafw00f -v https://target.com

# Scan multiple
wafw00f -i urls.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Fingerprinting | Identify WAF by response patterns |
| Detection | Check for WAF presence |
| Bypass | Know what you're up against |

## Syntax

```text
wafw00f <url> [options]
wafw00f -i <file> [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `<url>` | Target URL |
| `-i <file>` | Input file with URLs |

### Detection

| Option | Description |
|--------|-------------|
| `-a` | Test all WAFs (not just first match) |
| `-t <waf>` | Test for specific WAF |
| `-l` | List all detectable WAFs |

### Output

| Option | Description |
|--------|-------------|
| `-v` | Verbose |
| `-o <file>` | Output file |
| `-f <format>` | Format (csv, json, txt) |

### Request

| Option | Description |
|--------|-------------|
| `-p <proxy>` | Proxy |
| `-H <headers>` | Custom headers (file) |

## Recipes

### Basic Detection

```bash
# Single URL
wafw00f https://target.com

# Verbose output
wafw00f -v https://target.com

# Very verbose
wafw00f -vv https://target.com
```

### Test All WAFs

```bash
# Don't stop at first match
wafw00f -a https://target.com

# Test specific WAF
wafw00f -t Cloudflare https://target.com
```

### List WAFs

```bash
# List all detectable WAFs
wafw00f -l

# Common WAFs detected:
# - Cloudflare
# - AWS WAF
# - Akamai
# - Imperva
# - ModSecurity
# - Sucuri
# - F5 BIG-IP
```

### Multiple Targets

```bash
# From file
wafw00f -i urls.txt

# From stdin
cat urls.txt | xargs -I {} wafw00f {}

# With output
wafw00f -i urls.txt -o results.txt
```

### Output Formats

```bash
# JSON output
wafw00f https://target.com -f json -o results.json

# CSV output
wafw00f https://target.com -f csv -o results.csv

# Plain text
wafw00f https://target.com -f txt -o results.txt
```

### Through Proxy

```bash
# HTTP proxy
wafw00f -p http://127.0.0.1:8080 https://target.com

# SOCKS proxy
wafw00f -p socks5://127.0.0.1:1080 https://target.com
```

### Pipeline Integration

```bash
# Check all subdomains
subfinder -d target.com -silent | httpx -silent | \
  while read url; do wafw00f "$url"; done

# Batch check and save
cat urls.txt | while read url; do
  echo "=== $url ===" >> waf_results.txt
  wafw00f "$url" >> waf_results.txt 2>&1
done
```

### Script for JSON Output

```bash
#!/bin/bash
# waf_scan.sh
while read url; do
  result=$(wafw00f "$url" 2>/dev/null | grep -E "is behind|No WAF")
  echo "{\"url\":\"$url\",\"result\":\"$result\"}"
done < urls.txt | jq -s '.'
```

## Common WAFs

| WAF | Notes |
|-----|-------|
| Cloudflare | Very common, ray-id header |
| AWS WAF | Amazon hosted sites |
| Akamai | CDN + WAF |
| Imperva/Incapsula | Enterprise |
| ModSecurity | Open source |
| Sucuri | WordPress common |
| F5 BIG-IP | Enterprise |
| Barracuda | Enterprise |
| Fortinet | Enterprise |

## Output & Parsing

```bash
# JSON for parsing
wafw00f https://target.com -f json | jq '.'

# Extract WAF name
wafw00f https://target.com 2>&1 | grep -oP 'is behind \K[^)]+' 

# Check if WAF present
wafw00f https://target.com 2>&1 | grep -q "is behind" && echo "WAF detected"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No WAF detected | Try `-a` for all checks |
| Connection error | Check URL, use proxy |
| False positive | Verify manually |
| Timeout | Check network, increase timeout |

## References

- [wafw00f GitHub](https://github.com/EnableSecurity/wafw00f)
