# smbclient

> FTP-like client for SMB/CIFS shares. Use only on authorized targets.

## Quickstart

```bash
# List shares (null session)
smbclient -L //10.10.10.10 -N

# List shares with creds
smbclient -L //10.10.10.10 -U 'domain/user'

# Connect to share
smbclient //10.10.10.10/share -U 'domain/user'

# One-liner command
smbclient //10.10.10.10/share -U 'user' -c 'ls; get file.txt'

# Download file
smbclient //10.10.10.10/share -U 'user' -c 'get secret.txt'
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Service name | `//server/share` format |
| Null session | Anonymous access with `-N` |
| Interactive | FTP-like prompt (`smb: \>`) |
| Scripted | `-c 'cmd1; cmd2'` for automation |

## Syntax

```text
# List shares
smbclient -L //<host> [options]

# Connect to share
smbclient //<host>/<share> [options]

# Run commands
smbclient //<host>/<share> -c 'command' [options]
```

## Options

### Authentication

| Option | Description |
|--------|-------------|
| `-U 'domain/user'` | Username (prompts for password) |
| `-U 'user%pass'` | Username with password |
| `-N` | No password (null session) |
| `-A <file>` | Auth file (user/pass/domain) |
| `--pw-nt-hash` | Password is NTLM hash |
| `-W <workgroup>` | Workgroup/domain |

### Connection

| Option | Description |
|--------|-------------|
| `-L <host>` | List shares |
| `-I <ip>` | Connect to specific IP |
| `-p <port>` | Port (default 445) |
| `-m SMB2` / `-m SMB3` | Force protocol version |

### Security

| Option | Description |
|--------|-------------|
| `--client-protection=sign` | Require signing |
| `--client-protection=encrypt` | Require encryption (SMB3) |

### Output

| Option | Description |
|--------|-------------|
| `-g` | Grepable output (with `-L`) |
| `-c 'cmd'` | Run commands non-interactively |

## Interactive Commands

| Command | Description |
|---------|-------------|
| `ls` / `dir` | List files |
| `cd <dir>` | Change remote directory |
| `lcd <dir>` | Change local directory |
| `pwd` | Print remote directory |
| `get <file>` | Download file |
| `put <file>` | Upload file |
| `mget <pattern>` | Download multiple files |
| `mput <pattern>` | Upload multiple files |
| `mkdir <dir>` | Create directory |
| `rmdir <dir>` | Remove directory |
| `rm <file>` | Delete file |
| `recurse` | Toggle recursive mode |
| `prompt` | Toggle prompting for mget/mput |
| `exit` | Quit |

## Recipes

### Share Enumeration

```bash
# Null session
smbclient -L //10.10.10.10 -N

# With credentials
smbclient -L //10.10.10.10 -U 'DOMAIN/user'

# Grepable output
smbclient -L //10.10.10.10 -N -g

# Force IP (NetBIOS issues)
smbclient -L //hostname -I 10.10.10.10 -N
```

### Connecting to Shares

```bash
# Interactive session
smbclient //10.10.10.10/share -U 'user'

# With domain
smbclient //10.10.10.10/share -U 'DOMAIN/user'

# Pass-the-hash
smbclient //10.10.10.10/share -U 'user' --pw-nt-hash

# Force SMB version
smbclient //10.10.10.10/share -U 'user' -m SMB2
```

### File Operations

```bash
# Download file
smbclient //10.10.10.10/share -U 'user' -c 'get secret.txt'

# Download to specific path
smbclient //10.10.10.10/share -U 'user' -c 'get secret.txt /tmp/secret.txt'

# Upload file
smbclient //10.10.10.10/share -U 'user' -c 'put local.txt remote.txt'

# List and download
smbclient //10.10.10.10/share -U 'user' -c 'cd folder; ls; get file.txt'
```

### Recursive Download

```bash
# Interactive method
smbclient //10.10.10.10/share -U 'user'
# smb: \> recurse
# smb: \> prompt
# smb: \> mget *

# Or with tarmode
smbclient //10.10.10.10/share -U 'user' -Tc backup.tar '*'
```

### Auth File (for scripts)

```bash
# Create auth file
cat > auth.txt << EOF
username = admin
password = secret123
domain = CORP
EOF
chmod 600 auth.txt

# Use auth file
smbclient //10.10.10.10/share -A auth.txt
```

### Common Shares

```bash
# Admin shares (need admin rights)
smbclient //10.10.10.10/C$ -U 'admin'
smbclient //10.10.10.10/ADMIN$ -U 'admin'

# IPC$ (for enumeration)
smbclient //10.10.10.10/IPC$ -N

# SYSVOL/NETLOGON (domain)
smbclient //DC/SYSVOL -U 'user'
```

## Output & Parsing

```bash
# Grepable share list
smbclient -L //10.10.10.10 -N -g | grep Disk

# Parse with awk
smbclient -L //10.10.10.10 -N -g | awk -F'|' '/Disk/ {print $2}'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| NT_STATUS_LOGON_FAILURE | Check username/password/domain |
| NT_STATUS_ACCESS_DENIED | Check permissions, try different share |
| Connection refused | Check port 445/139, firewall |
| Protocol error | Try `-m SMB2` or `-m SMB3` |
| Name resolution | Use `-I <ip>` to specify IP directly |

## References

- [smbclient Manual](https://www.samba.org/samba/docs/current/man-html/smbclient.1.html)
- [Samba Documentation](https://www.samba.org/samba/docs/)
