# xsstrike

> Advanced XSS detection suite with fuzzing engine.

## Quickstart

```bash
# Single URL
xsstrike -u "https://target.com/page?q=test"

# Crawl and test
xsstrike -u "https://target.com" --crawl

# POST data
xsstrike -u "https://target.com/submit" --data "name=test"
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Fuzzing | Intelligent payload generation |
| Context analysis | Detect reflection context |
| WAF detection | Identify and bypass |
| DOM XSS | JavaScript analysis |

## Syntax

```text
xsstrike -u <url> [options]
```

## Options

### Target

| Option | Description |
|--------|-------------|
| `-u <url>` | Target URL |
| `--data <d>` | POST data |
| `-e <enc>` | Encode payloads |
| `--path` | Test URL path |

### Scanning

| Option | Description |
|--------|-------------|
| `--crawl` | Crawl and test |
| `--fuzzer` | Fuzzer mode |
| `--blind` | Blind XSS |
| `--skip` | Skip DOM scan |
| `--skip-poc` | Skip PoC |

### Request

| Option | Description |
|--------|-------------|
| `--headers` | Add headers (JSON) |
| `--proxy` | Proxy URL |
| `-t <n>` | Threads |
| `--timeout <sec>` | Timeout |

### Output

| Option | Description |
|--------|-------------|
| `-f <file>` | Log file |
| `--console-log-level` | Log level |

## Recipes

### Basic Scanning

```bash
# Test URL parameter
xsstrike -u "https://target.com/search?q=test"

# Test all parameters
xsstrike -u "https://target.com/page?a=1&b=2&c=3"
```

### POST Requests

```bash
# POST data
xsstrike -u "https://target.com/submit" --data "email=test@test.com"

# JSON data
xsstrike -u "https://target.com/api" --data '{"name":"test"}' --headers '{"Content-Type":"application/json"}'
```

### Crawl Mode

```bash
# Crawl and test
xsstrike -u "https://target.com" --crawl

# With depth
xsstrike -u "https://target.com" --crawl -l 3
```

### Fuzzer Mode

```bash
# Enable fuzzer
xsstrike -u "https://target.com/page?q=test" --fuzzer
```

### Blind XSS

```bash
# Blind XSS testing
xsstrike -u "https://target.com/page?q=test" --blind
```

### Path Injection

```bash
# Test URL path
xsstrike -u "https://target.com/search/test" --path
```

### With Proxy

```bash
# Through Burp
xsstrike -u "https://target.com/page?q=test" --proxy "http://127.0.0.1:8080"
```

### With Headers

```bash
# Custom headers
xsstrike -u "https://target.com/page?q=test" --headers '{"Authorization":"Bearer token","Cookie":"session=abc"}'
```

## Output & Parsing

```bash
# Log to file
xsstrike -u "https://target.com/page?q=test" -f results.txt

# Review findings
cat results.txt | grep -E "Payload|Vulnerable"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No vulns | Try `--fuzzer`, check manually |
| Blocked | Use proxy, slow down |
| False positives | Verify in browser |

## References

- [XSStrike GitHub](https://github.com/s0md3v/XSStrike)
