# masscan

> Internet-scale port scanner. Extremely fast.

## Quickstart

```bash
# Scan single host
sudo masscan -p80,443 10.10.10.10

# Scan network
sudo masscan -p1-65535 10.10.10.0/24 --rate 10000

# Output to file
sudo masscan -p80,443,8080 10.10.10.0/24 -oL results.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Asynchronous | Stateless scanning |
| Rate | Packets per second |
| Banners | Optional service detection |

## Syntax

```text
masscan <target> -p<ports> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `<target>` | IP, CIDR, range |
| `--exclude <ip>` | Exclude hosts |
| `--excludefile <f>` | Exclude file |
| `-iL <file>` | Input file |

### Ports

| Option | Description |
|--------|-------------|
| `-p<ports>` | Port list/range |
| `-p1-65535` | All ports |
| `-p80,443,8080` | Specific ports |
| `--top-ports <n>` | Top N ports |
| `-pU:<ports>` | UDP ports |

### Performance

| Option | Description |
|--------|-------------|
| `--rate <n>` | Packets per second |
| `--max-rate <n>` | Max rate |
| `--retries <n>` | Retries |
| `--wait <sec>` | Wait after scan |

### Output

| Option | Description |
|--------|-------------|
| `-oL <file>` | List output |
| `-oJ <file>` | JSON output |
| `-oG <file>` | Grepable output |
| `-oX <file>` | XML output |
| `-oB <file>` | Binary output |

### Banners

| Option | Description |
|--------|-------------|
| `--banners` | Grab banners |
| `--source-port <p>` | Source port |

## Recipes

### Basic Scanning

```bash
# Single host, common ports
sudo masscan -p80,443,22 10.10.10.10

# Network scan
sudo masscan -p80,443 10.10.10.0/24

# All ports (slow but thorough)
sudo masscan -p1-65535 10.10.10.10 --rate 5000
```

### High-Speed Scanning

```bash
# Fast scan (careful!)
sudo masscan -p1-65535 10.10.10.0/24 --rate 100000

# Balanced
sudo masscan -p1-65535 10.10.10.0/24 --rate 10000

# Slow and quiet
sudo masscan -p1-65535 10.10.10.0/24 --rate 1000
```

### UDP Scanning

```bash
# UDP ports
sudo masscan -pU:53,161,123 10.10.10.0/24

# Mixed TCP/UDP
sudo masscan -p80,443 -pU:53,161 10.10.10.0/24
```

### Banner Grabbing

```bash
# Grab banners
sudo masscan -p80,443 10.10.10.0/24 --banners

# With source port (NAT traversal)
sudo masscan -p80,443 10.10.10.0/24 --banners --source-port 61000
```

### Output Formats

```bash
# List format
sudo masscan -p80,443 10.10.10.0/24 -oL results.txt

# JSON format
sudo masscan -p80,443 10.10.10.0/24 -oJ results.json

# Grepable (nmap style)
sudo masscan -p80,443 10.10.10.0/24 -oG results.gnmap

# XML
sudo masscan -p80,443 10.10.10.0/24 -oX results.xml
```

### Exclude Targets

```bash
# Exclude IPs
sudo masscan -p80 10.10.10.0/24 --exclude 10.10.10.1,10.10.10.2

# Exclude file
sudo masscan -p80 10.10.10.0/24 --excludefile exclude.txt
```

### Pipeline

```bash
# masscan → nmap (detailed)
sudo masscan -p1-65535 10.10.10.10 --rate 10000 -oL - | \
  awk '/open/{print $4":"$3}' | \
  xargs -I {} nmap -sV -p {} 10.10.10.10

# masscan → httpx
sudo masscan -p80,443,8080 10.10.10.0/24 -oL - | \
  awk '/open/{print $4":"$3}' | \
  httpx -silent
```

### Configuration File

```bash
# Create config
sudo masscan -p80,443 10.10.10.0/24 --echo > scan.conf

# Run from config
sudo masscan -c scan.conf
```

## Output & Parsing

```bash
# Parse list output
awk '/open/{print $4":"$3}' results.txt

# Parse JSON
cat results.json | jq -r '.[] | "\(.ip):\(.ports[].port)"'

# Extract IPs only
awk '/open/{print $4}' results.txt | sort -u

# Convert to host:port
awk '/open/{printf "%s:%s\n", $4, $3}' results.txt
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Need root/sudo |
| No results | Check rate, firewall |
| Too slow | Increase `--rate` |
| Missing hosts | Add retries |

## References

- [masscan GitHub](https://github.com/robertdavidgraham/masscan)
