# whatweb

> Web technology fingerprinting tool. Identifies CMS, frameworks, and server software.

## Quickstart

```bash
# Scan single URL
whatweb https://target.com

# Verbose output
whatweb -v https://target.com

# Aggressive mode
whatweb -a 3 https://target.com

# Scan list
whatweb -i urls.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Plugins | Detection modules for technologies |
| Aggression | 1=passive, 3=aggressive |
| Fingerprinting | Match patterns in responses |

## Syntax

```text
whatweb [options] <url>
whatweb [options] -i <file>
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `<url>` | Single URL |
| `-i <file>` | Input file |
| `--input-file <f>` | Same as -i |

### Aggression

| Option | Description |
|--------|-------------|
| `-a <level>` | Aggression level (1-4) |
| `--aggression <n>` | 1=stealthy, 3=aggressive, 4=heavy |

### Output

| Option | Description |
|--------|-------------|
| `-v` | Verbose |
| `-q` | Quiet |
| `--color=never` | No colors |
| `--log-verbose <f>` | Verbose log |
| `--log-brief <f>` | Brief log |
| `--log-json <f>` | JSON output |
| `--log-xml <f>` | XML output |

### Request

| Option | Description |
|--------|-------------|
| `-U <ua>` | User agent |
| `-H <header>` | Custom header |
| `--cookie <c>` | Cookie |
| `--proxy <url>` | Proxy |

### Performance

| Option | Description |
|--------|-------------|
| `-t <n>` | Threads |
| `--wait <sec>` | Delay between requests |
| `--max-threads <n>` | Max threads |

### Plugins

| Option | Description |
|--------|-------------|
| `-l` | List plugins |
| `-p <plugins>` | Use specific plugins |
| `--info-plugins <p>` | Plugin info |

## Recipes

### Basic Scanning

```bash
# Simple scan
whatweb https://target.com

# Verbose
whatweb -v https://target.com

# Very verbose
whatweb -vv https://target.com

# Multiple targets
whatweb https://target1.com https://target2.com
```

### Aggression Levels

```bash
# Passive (1 request)
whatweb -a 1 https://target.com

# Medium (default)
whatweb -a 2 https://target.com

# Aggressive (more requests)
whatweb -a 3 https://target.com

# Heavy (many requests)
whatweb -a 4 https://target.com
```

### List Scanning

```bash
# From file
whatweb -i urls.txt

# From stdin
cat urls.txt | whatweb

# With options
whatweb -i urls.txt -a 3 -v
```

### Specific Plugins

```bash
# List available plugins
whatweb -l

# Use specific plugins
whatweb -p wordpress,apache,php https://target.com

# Plugin info
whatweb --info-plugins wordpress
```

### Output Formats

```bash
# JSON output
whatweb --log-json results.json https://target.com

# XML output
whatweb --log-xml results.xml https://target.com

# Brief log
whatweb --log-brief brief.txt https://target.com

# Verbose log
whatweb --log-verbose verbose.txt https://target.com
```

### Through Proxy

```bash
# HTTP proxy
whatweb --proxy http://127.0.0.1:8080 https://target.com

# With auth
whatweb --proxy-user admin:pass --proxy http://proxy:8080 https://target.com
```

### With Authentication

```bash
# Cookie
whatweb --cookie "session=abc123" https://target.com

# Custom header
whatweb -H "Authorization: Bearer token" https://target.com

# User agent
whatweb -U "Mozilla/5.0 Custom" https://target.com
```

### Network Range

```bash
# Scan subnet (careful!)
whatweb 10.10.10.0/24

# With port
whatweb 10.10.10.10:8080
```

### Integration Pipeline

```bash
# httpx → whatweb
cat hosts.txt | httpx -silent | xargs -I {} whatweb {}

# subfinder → httpx → whatweb
subfinder -d target.com -silent | httpx -silent | \
  while read url; do whatweb "$url"; done

# Output to JSON for parsing
cat urls.txt | while read url; do
  whatweb --log-json - "$url" 2>/dev/null
done | jq -s '.'
```

## Output & Parsing

```bash
# JSON output
whatweb --log-json results.json https://target.com

# Parse JSON
cat results.json | jq -r '.[].plugins | keys[]'

# Find specific tech
whatweb https://target.com | grep -i wordpress

# Extract version info
whatweb -v https://target.com 2>&1 | grep -E "version|[0-9]+\.[0-9]+"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow scan | Reduce `-a` level |
| Missing detections | Increase `-a` level |
| Blocked | Change `-U` user agent |
| Timeout | Check connectivity |

## References

- [WhatWeb GitHub](https://github.com/urbanadventurer/WhatWeb)
- [WhatWeb Wiki](https://github.com/urbanadventurer/WhatWeb/wiki)
