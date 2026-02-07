# Nmap

> Network scanner for host discovery, port scanning, service detection, and scripted enumeration. Use only on authorized targets.

## Quickstart

```bash
# Fast scan: SYN scan, all ports, service detection, default scripts
sudo nmap -sS -p- -sV -sC -T4 --open -oA scan <target>

# Quick top ports scan
sudo nmap -sS --top-ports 1000 -sV -T4 --open <target>

# Ping sweep (find live hosts)
sudo nmap -sn 10.10.10.0/24

# UDP scan (common ports)
sudo nmap -sU -p53,67,123,161,500 -sV <target>
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Host discovery | Find live hosts (ICMP, ARP, TCP/UDP probes) |
| Port scanning | Find open/closed/filtered ports |
| Service detection | `-sV` probes ports to identify services |
| OS detection | `-O` fingerprints TCP/IP stack (needs root) |
| NSE scripts | Lua scripts for enumeration and vuln scanning |

## Syntax

```text
nmap [scan type] [options] <target>
```

**Targets:** IP, hostname, CIDR (`10.0.0.0/24`), range (`10.0.0.1-50`), file (`-iL hosts.txt`)

## Options

### Target Specification

| Option | Description |
|--------|-------------|
| `<target>` | IP, hostname, CIDR, range |
| `-iL <file>` | Read targets from file |
| `--exclude <hosts>` | Exclude hosts |
| `-n` | No DNS resolution (faster) |

### Host Discovery

| Option | Description |
|--------|-------------|
| `-sn` | Ping scan only, no port scan |
| `-Pn` | Skip discovery, treat all as up |
| `-PS <ports>` | TCP SYN ping |
| `-PA <ports>` | TCP ACK ping |
| `-PU <ports>` | UDP ping |
| `-PR` | ARP ping (LAN only) |

### Port Selection

| Option | Description |
|--------|-------------|
| `-p <ports>` | Specific ports (`-p22,80,443`) |
| `-p-` | All 65535 ports |
| `-p1-1000` | Port range |
| `--top-ports <n>` | Top N common ports |
| `-F` | Fast mode (fewer ports) |

### Scan Types

| Option | Description |
|--------|-------------|
| `-sS` | TCP SYN scan (stealth, needs root) |
| `-sT` | TCP connect scan (no root needed) |
| `-sU` | UDP scan |
| `-sV` | Service/version detection |
| `-sC` | Default NSE scripts |
| `-O` | OS detection |
| `-A` | Aggressive (sV + O + sC + traceroute) |

### Timing & Performance

| Option | Description |
|--------|-------------|
| `-T0` to `-T5` | Timing template (4 = fast, 5 = insane) |
| `--min-rate <n>` | Min packets/sec |
| `--max-rate <n>` | Max packets/sec |
| `--max-retries <n>` | Reduce retries for speed |

### Output

| Option | Description |
|--------|-------------|
| `-oA <base>` | All formats (.nmap, .xml, .gnmap) |
| `-oN <file>` | Normal output |
| `-oX <file>` | XML output (best for parsing) |
| `-oG <file>` | Grepable (deprecated) |
| `-v` / `-vv` | Verbose |
| `--open` | Show only open ports |
| `--reason` | Show why port is open/filtered |

### NSE Scripts

| Option | Description |
|--------|-------------|
| `-sC` | Default scripts |
| `--script <name>` | Run specific script(s) |
| `--script "category"` | Run category (safe, vuln, discovery) |
| `--script-args k=v` | Pass args to scripts |

## Recipes

### Host Discovery

```bash
# Ping sweep
sudo nmap -sn 10.10.10.0/24

# ARP scan (local network)
sudo nmap -sn -PR 192.168.1.0/24

# TCP SYN ping (when ICMP blocked)
sudo nmap -sn -PS80,443,22 10.10.10.0/24

# Skip discovery (firewall blocks pings)
sudo nmap -Pn -p80,443 10.10.10.10
```

### Port Scanning

```bash
# Fast top 1000 ports
sudo nmap -sS --top-ports 1000 -T4 --open <target>

# Full TCP scan
sudo nmap -sS -p- -T4 --min-rate 1000 --open <target>

# Service detection on specific ports
sudo nmap -sS -sV -p22,80,443,8080 <target>

# UDP scan (targeted)
sudo nmap -sU -p53,67,123,161,500,514 -sV <target>
```

### Web Enumeration

```bash
# HTTP enumeration
sudo nmap -sV --script http-enum -p80,443,8080 <target>

# Find hidden paths
sudo nmap --script http-enum --script-args http-enum.basepath='/api/' -p80 <target>

# Grab titles and headers
sudo nmap -sV --script http-title,http-headers -p80,443 <target>

# Check for vulns
sudo nmap --script http-vuln* -p80,443 <target>
```

### SMB Enumeration

```bash
# SMB shares and users
sudo nmap --script smb-enum-shares,smb-enum-users -p445 <target>

# SMB vulnerabilities
sudo nmap --script smb-vuln* -p445 <target>

# All SMB scripts
sudo nmap --script smb* -p445 <target>
```

### Vulnerability Scanning

```bash
# Run vuln category (noisy!)
sudo nmap --script vuln -p- <target>

# Specific CVE checks
sudo nmap --script "*ms17-010*" -p445 <target>
```

### Firewall Evasion

```bash
# Fragment packets
sudo nmap -f -sS -p80 <target>

# Use decoys
sudo nmap -D RND:10 -sS -p80 <target>

# Source port (sometimes bypasses ACLs)
sudo nmap --source-port 53 -sS -p80 <target>
```

## Output & Parsing

```bash
# Save all formats
sudo nmap -sS -sV -oA results <target>

# Parse XML with grep
grep -oP 'portid="\K[0-9]+' results.xml | sort -u

# Convert to HTML
xsltproc results.xml -o results.html

# Quick open ports list
grep "open" results.nmap | grep -oP '\d+(?=/tcp)'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Host seems down | Use `-Pn` to skip discovery |
| All ports filtered | Check routing, try `--packet-trace` |
| UDP scan very slow | Narrow ports, use `--max-retries 1` |
| Service detection wrong | Increase `--version-intensity` |
| OS detection fails | Need open + closed ports, run as root |

## References

- [Nmap Documentation](https://nmap.org/docs.html)
- [NSE Script List](https://nmap.org/nsedoc/)
- [Nmap Cheat Sheet (SANS)](https://www.sans.org/posters/nmap-cheat-sheet/)
