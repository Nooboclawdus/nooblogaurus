# rustscan

> Fast port scanner that pipes to nmap for service detection.

## Quickstart

```bash
# Scan single host
rustscan -a 10.10.10.10

# With nmap
rustscan -a 10.10.10.10 -- -sV -sC

# Specific ports
rustscan -a 10.10.10.10 -p 22,80,443
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Speed | Async Rust-based scanning |
| nmap integration | Auto-pipes to nmap |
| Batch size | Control concurrent connections |

## Syntax

```text
rustscan -a <target> [options] -- [nmap options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-a <addr>` | Target address(es) |
| `-p <ports>` | Port list/range |
| `-r <range>` | Port range (1-65535) |
| `--top` | Scan top 1000 ports |

### Performance

| Option | Description |
|--------|-------------|
| `-b <n>` | Batch size (default 4500) |
| `-t <ms>` | Timeout (default 1500) |
| `-u <n>` | Ulimit |
| `--tries <n>` | Retry attempts |

### Output

| Option | Description |
|--------|-------------|
| `-g` | Greppable output |
| `-o <file>` | Output file |
| `--no-nmap` | Skip nmap |

### nmap

| Option | Description |
|--------|-------------|
| `--` | Pass args to nmap |
| `--scripts <s>` | nmap scripts |

## Recipes

### Basic Scanning

```bash
# All ports, single host
rustscan -a 10.10.10.10

# Specific ports
rustscan -a 10.10.10.10 -p 22,80,443,8080

# Port range
rustscan -a 10.10.10.10 -r 1-10000

# Top 1000 ports
rustscan -a 10.10.10.10 --top
```

### With nmap

```bash
# Service version
rustscan -a 10.10.10.10 -- -sV

# Default scripts
rustscan -a 10.10.10.10 -- -sC

# Full scan
rustscan -a 10.10.10.10 -- -sV -sC -A

# Vuln scripts
rustscan -a 10.10.10.10 -- --script vuln
```

### Performance Tuning

```bash
# Faster (higher batch)
rustscan -a 10.10.10.10 -b 10000

# Slower/quieter
rustscan -a 10.10.10.10 -b 1000 -t 3000

# Increase ulimit for speed
rustscan -a 10.10.10.10 -u 5000
```

### Multiple Targets

```bash
# Multiple IPs
rustscan -a 10.10.10.10,10.10.10.11,10.10.10.12

# CIDR (careful!)
rustscan -a 10.10.10.0/24

# From file
rustscan -a $(cat hosts.txt | tr '\n' ',')
```

### Output

```bash
# Greppable
rustscan -a 10.10.10.10 -g

# Save to file
rustscan -a 10.10.10.10 -o results.txt

# Skip nmap (just ports)
rustscan -a 10.10.10.10 --no-nmap
```

### Skip nmap (Fast Mode)

```bash
# Just find open ports
rustscan -a 10.10.10.10 --no-nmap

# Greppable for parsing
rustscan -a 10.10.10.10 -g --no-nmap
```

### Docker

```bash
# Run via Docker
docker run -it --rm rustscan/rustscan:latest -a 10.10.10.10

# With nmap args
docker run -it --rm rustscan/rustscan:latest -a 10.10.10.10 -- -sV
```

### Pipeline

```bash
# rustscan → detailed nmap
rustscan -a 10.10.10.10 --no-nmap -g | \
  awk -F'[\\[\\],]' '{for(i=2;i<NF;i++) print $i}' | \
  xargs -I {} nmap -sV -p {} 10.10.10.10

# Quick port list for scripting
rustscan -a 10.10.10.10 -g --no-nmap 2>/dev/null | \
  grep -oP '\[\K[^\]]+' | tr ',' '\n'
```

## Output & Parsing

```bash
# Greppable parsing
rustscan -a 10.10.10.10 -g --no-nmap 2>/dev/null | \
  grep -oP '\[\K[^\]]+'

# Extract ports
rustscan -a 10.10.10.10 --no-nmap 2>&1 | \
  grep "Open" | awk '{print $NF}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Too many files | Reduce `-b` batch size |
| Slow | Increase `-b`, check network |
| Missing ports | Add `--tries`, increase timeout |
| nmap errors | Check nmap args after `--` |

## References

- [RustScan GitHub](https://github.com/RustScan/RustScan)
- [RustScan Wiki](https://github.com/RustScan/RustScan/wiki)
