# ffuf

> Fast web fuzzer for content discovery, parameter fuzzing, and vhost enumeration. Use only on authorized targets.

## Quickstart

```bash
# Directory discovery
ffuf -u https://target.com/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt

# With extensions
ffuf -u https://target.com/FUZZ -w wordlist.txt -e .php,.txt,.bak

# Filter by size (hide 404 pages)
ffuf -u https://target.com/FUZZ -w wordlist.txt -fs 1234

# Virtual host discovery
ffuf -u http://10.10.10.10 -H "Host: FUZZ.target.com" -w subdomains.txt

# Parameter fuzzing
ffuf -u https://target.com/page?FUZZ=test -w params.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| FUZZ keyword | Marks injection point (URL, headers, body) |
| Matchers | Show results matching criteria (status, size, words) |
| Filters | Hide results matching criteria (noise reduction) |
| Autocalibrate | `-ac` auto-filters baseline responses |
| Modes | clusterbomb, pitchfork for multi-wordlist fuzzing |

## Syntax

```text
ffuf -u <url-with-FUZZ> -w <wordlist> [options]
ffuf -request <raw.txt> -w <wordlist> [options]
```

## Options

### Input & Target

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL with FUZZ keyword |
| `-w <file>` | Wordlist (can map: `-w words.txt:W`) |
| `-w <file>:KEYWORD` | Named wordlist for multi-position |
| `-mode <mode>` | clusterbomb, pitchfork, sniper |
| `-request <file>` | Use raw HTTP request file |
| `-request-proto https` | Protocol for raw request |

### Request Options

| Option | Description |
|--------|-------------|
| `-H "Header: FUZZ"` | Add/fuzz header |
| `-X POST` | HTTP method |
| `-d "data=FUZZ"` | Request body |
| `-b "cookie=value"` | Cookies |
| `-r` | Follow redirects |
| `-x http://proxy:8080` | Proxy (Burp/Caido) |

### Matchers (show results)

| Option | Description |
|--------|-------------|
| `-mc 200,301,403` | Match status codes |
| `-ms <size>` | Match response size |
| `-mw <words>` | Match word count |
| `-ml <lines>` | Match line count |
| `-mr <regex>` | Match regex in body |

### Filters (hide results)

| Option | Description |
|--------|-------------|
| `-fc 404,500` | Filter status codes |
| `-fs <size>` | Filter response size |
| `-fw <words>` | Filter word count |
| `-fl <lines>` | Filter line count |
| `-fr <regex>` | Filter regex |
| `-ac` | Autocalibrate filters |

### Performance

| Option | Description |
|--------|-------------|
| `-t <n>` | Threads (default 40) |
| `-rate <n>` | Requests per second |
| `-timeout <sec>` | Request timeout |
| `-p <delay>` | Delay between requests |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-of json` | Output format (json, csv, html, md) |
| `-v` | Verbose (show redirects) |

## Recipes

### Directory Discovery

```bash
# Basic directory scan
ffuf -u https://target.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -mc 200,204,301,302,307,401,403 -t 50

# With extensions (files)
ffuf -u https://target.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-files.txt \
  -e .php,.asp,.aspx,.jsp,.txt,.bak,.old,.zip \
  -mc 200,204,301,302,307,401,403

# Recursive discovery
ffuf -u https://target.com/FUZZ \
  -w wordlist.txt -recursion -recursion-depth 2

# Filter noise (custom 404 pages)
ffuf -u https://target.com/FUZZ -w wordlist.txt \
  -fc 404 -fs 1543 -fw 200
```

### Virtual Host Discovery

```bash
# Subdomain/vhost discovery
ffuf -u http://10.10.10.10 \
  -H "Host: FUZZ.target.com" \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -fs 0 -mc 200,301,302,401,403

# With autocalibrate
ffuf -u http://10.10.10.10 \
  -H "Host: FUZZ.target.com" \
  -w subdomains.txt -ac
```

### Parameter Discovery

```bash
# GET parameter names
ffuf -u https://target.com/page?FUZZ=test \
  -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt \
  -mc 200,302 -fs 1234

# POST parameter names
ffuf -u https://target.com/api \
  -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "FUZZ=test" \
  -w /usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt

# Parameter value fuzzing (IDOR)
ffuf -u https://target.com/user?id=FUZZ \
  -w /usr/share/seclists/Fuzzing/4-digits-0000-9999.txt \
  -mc 200 -rate 100
```

### POST Data Fuzzing

```bash
# Login form fuzzing
ffuf -u https://target.com/login \
  -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=FUZZ" \
  -w /usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt \
  -fc 401 -fs 1234

# JSON API fuzzing
ffuf -u https://target.com/api/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"user":"admin","pass":"FUZZ"}' \
  -w passwords.txt -mc 200
```

### Multi-Position Fuzzing

```bash
# Username + password (clusterbomb = all combinations)
ffuf -u https://target.com/login \
  -X POST -d "user=USER&pass=PASS" \
  -w users.txt:USER -w passes.txt:PASS \
  -mode clusterbomb -fc 401

# Path + extension (pitchfork = parallel)
ffuf -u https://target.com/PATHFUZZ.EXTFUZZ \
  -w paths.txt:PATHFUZZ -w extensions.txt:EXTFUZZ \
  -mode pitchfork
```

### Through Proxy (Burp/Caido)

```bash
ffuf -u https://target.com/FUZZ \
  -w wordlist.txt \
  -x http://127.0.0.1:8080 \
  -mc 200,301,403
```

## Output & Parsing

```bash
# JSON output (best for parsing)
ffuf -u https://target.com/FUZZ -w wordlist.txt -of json -o results.json

# Parse JSON results
cat results.json | jq -r '.results[].url'

# CSV for spreadsheets
ffuf -u https://target.com/FUZZ -w wordlist.txt -of csv -o results.csv

# HTML report
ffuf -u https://target.com/FUZZ -w wordlist.txt -of html -o results.html
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Everything matches | Use `-ac` or filter by size/words `-fs`/`-fw` |
| Rate limited/blocked | Reduce `-rate`, add `-p` delay |
| Proxy issues | Check proxy config, use `-k` for TLS errors |
| Too many redirects | Remove `-r` to see raw responses |

## References

- [ffuf GitHub](https://github.com/ffuf/ffuf)
- [SecLists Wordlists](https://github.com/danielmiessler/SecLists)
- [ffuf Guide (HackTricks)](https://book.hacktricks.xyz/pentesting-web/web-tool-ffuf)
