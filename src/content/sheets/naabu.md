# naabu

> Fast port scanner with SYN/CONNECT scanning. ProjectDiscovery.

## Quickstart

```bash
# Scan single host
naabu -host target.com

# Top 100 ports
naabu -host target.com -top-ports 100

# Full port scan
naabu -host target.com -p -

# Scan list, pipe to httpx
naabu -l hosts.txt -silent | httpx -silent
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| SYN scan | Fast, stealthy (needs root) |
| CONNECT scan | Full TCP connect (no root) |
| Service discovery | Combine with httpx for services |

## Syntax

```text
naabu -host <target> [options]
naabu -l <file> [options]
```

## Options

### Input

| Option | Description |
|--------|-------------|
| `-host <target>` | Single target |
| `-l <file>` | Host list |
| `-` | Read from stdin |
| `-exclude-hosts <h>` | Exclude hosts |
| `-iL <file>` | Input list (nmap style) |

### Ports

| Option | Description |
|--------|-------------|
| `-p <ports>` | Port range (`-p 80,443,8080`) |
| `-p -` | All ports (1-65535) |
| `-top-ports <n>` | Top N ports (100, 1000) |
| `-ep <ports>` | Exclude ports |
| `-pt <type>` | Port type (tcp, udp) |

### Scan Type

| Option | Description |
|--------|-------------|
| `-sn` | Host discovery only |
| `-Pn` | Skip host discovery |
| `-s` | SYN scan (needs root) |
| `-sc` | CONNECT scan |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-json` | JSON output |
| `-csv` | CSV output |
| `-silent` | Silent mode |
| `-v` | Verbose |
| `-nc` | No color |

### Performance

| Option | Description |
|--------|-------------|
| `-c <n>` | Concurrency (default 25) |
| `-rate <n>` | Packets per second |
| `-timeout <ms>` | Timeout in ms |
| `-retries <n>` | Retries |
| `-warm-up-time <sec>` | Warm up time |

### Integration

| Option | Description |
|--------|-------------|
| `-nmap` | Run nmap on results |
| `-nmap-cli <args>` | Nmap arguments |

## Recipes

### Basic Scanning

```bash
# Quick scan (top 100)
naabu -host target.com -top-ports 100

# Common web ports
naabu -host target.com -p 80,443,8080,8443

# Full scan
naabu -host target.com -p -

# Multiple hosts
naabu -l hosts.txt -top-ports 100
```

### Port Ranges

```bash
# Specific ports
naabu -host target.com -p 22,80,443,3389

# Port range
naabu -host target.com -p 1-1000

# Common + high ports
naabu -host target.com -p 1-1000,8000-9000

# All ports
naabu -host target.com -p -
```

### Scan Types

```bash
# SYN scan (fast, needs root)
sudo naabu -host target.com -s

# CONNECT scan (no root)
naabu -host target.com -sc

# Host discovery only
naabu -host target.com -sn

# Skip discovery (scan anyway)
naabu -host target.com -Pn
```

### Pipeline Integration

```bash
# naabu → httpx
naabu -host target.com -silent | httpx -silent

# subfinder → naabu → httpx
subfinder -d target.com -silent | naabu -silent | httpx -silent

# naabu → nmap (detailed)
naabu -host target.com -nmap-cli "-sV -sC"

# Mass scanning
naabu -l hosts.txt -top-ports 100 -silent | httpx -silent -o live.txt
```

### Performance Tuning

```bash
# Fast scan
naabu -host target.com -c 50 -rate 1000

# Careful scan (avoid detection)
naabu -host target.com -c 5 -rate 100

# Large scale
naabu -l hosts.txt -c 100 -rate 5000
```

### Service Discovery

```bash
# Web services
naabu -host target.com -p 80,443,8080,8443 | httpx -silent

# All services with nmap
naabu -host target.com -p - -nmap-cli "-sV"

# Format for nmap input
naabu -host target.com -silent -o ports.txt
```

### Network Range

```bash
# CIDR scanning
naabu -host 10.10.10.0/24 -top-ports 100

# Exclude hosts
naabu -host 10.10.10.0/24 -exclude-hosts 10.10.10.1,10.10.10.2
```

## Output & Parsing

```bash
# JSON output
naabu -host target.com -json -o results.json

# CSV output
naabu -host target.com -csv -o results.csv

# Parse JSON
cat results.json | jq -r '.port'

# Format: host:port
naabu -host target.com -silent

# Unique ports
naabu -l hosts.txt -silent | cut -d: -f2 | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SYN scan fails | Need root/sudo |
| Slow scan | Increase `-c` and `-rate` |
| Missing ports | Increase `-retries`, check firewall |
| Permission denied | Use `-sc` for CONNECT scan |

## References

- [naabu GitHub](https://github.com/projectdiscovery/naabu)
- [naabu Docs](https://docs.projectdiscovery.io/tools/naabu/overview)
