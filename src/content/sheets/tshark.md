# tshark

> Terminal-based Wireshark for packet capture and analysis. Use only on authorized networks.

## Quickstart

```bash
# List interfaces
tshark -D

# Live capture
sudo tshark -i eth0

# Capture to file
sudo tshark -i eth0 -w capture.pcapng

# Read pcap with filter
tshark -r capture.pcap -Y "http.request"

# Extract fields
tshark -r capture.pcap -Y "http" -T fields -e ip.src -e http.host -e http.request.uri
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Capture filter (`-f`) | BPF syntax, applied before capture (fast) |
| Display filter (`-Y`) | Wireshark syntax, applied during read (powerful) |
| Field extraction | `-T fields -e field.name` for structured output |
| Statistics (`-z`) | Built-in analysis (conversations, endpoints, protocols) |

## Syntax

```text
# Capture
tshark -i <interface> [-f "capture filter"] [-w output.pcap]

# Read/analyze
tshark -r <file.pcap> [-Y "display filter"] [output options]
```

## Options

### Capture

| Option | Description |
|--------|-------------|
| `-D` | List interfaces |
| `-i <iface>` | Capture interface |
| `-f "filter"` | BPF capture filter |
| `-w <file>` | Write to pcap file |
| `-c <n>` | Stop after n packets |
| `-a duration:60` | Stop after 60 seconds |
| `-b filesize:10000` | Ring buffer, 10MB files |
| `-B <MiB>` | Capture buffer size |

### Display & Filter

| Option | Description |
|--------|-------------|
| `-r <file>` | Read from pcap |
| `-Y "filter"` | Display filter (Wireshark syntax) |
| `-n` | No name resolution |
| `-V` | Verbose packet details |
| `-x` | Hex dump |

### Output

| Option | Description |
|--------|-------------|
| `-T fields` | Field extraction mode |
| `-e <field>` | Field to extract (repeatable) |
| `-E header=y` | Include header row |
| `-E separator=,` | CSV separator |
| `-T json` | JSON output |
| `-q` | Quiet (suppress packet list) |

### Statistics

| Option | Description |
|--------|-------------|
| `-z conv,ip` | IP conversations |
| `-z endpoints,ip` | IP endpoints |
| `-z http,stat` | HTTP stats |
| `-z follow,tcp,ascii,0` | Follow TCP stream |
| `-z expert` | Expert info summary |

## Recipes

### Live Capture

```bash
# Capture all traffic
sudo tshark -i eth0 -w capture.pcapng

# Capture with BPF filter (fast)
sudo tshark -i eth0 -f "host 10.10.10.10 and tcp port 80" -w http.pcapng

# Capture for 60 seconds
sudo tshark -i eth0 -a duration:60 -w 60sec.pcapng

# Ring buffer (5 files, 10MB each)
sudo tshark -i eth0 -b filesize:10000 -b files:5 -w ring.pcapng
```

### Display Filters

```bash
# HTTP requests
tshark -r capture.pcap -Y "http.request"

# IP address
tshark -r capture.pcap -Y "ip.addr == 10.10.10.10"

# TCP port
tshark -r capture.pcap -Y "tcp.port == 443"

# DNS queries
tshark -r capture.pcap -Y "dns.qry.name"

# TLS handshakes
tshark -r capture.pcap -Y "tls.handshake"

# Combined filters
tshark -r capture.pcap -Y "http.request and ip.src == 10.10.10.10"
```

### Field Extraction

```bash
# HTTP fields
tshark -r capture.pcap -Y "http.request" \
  -T fields -e ip.src -e ip.dst -e http.host -e http.request.uri

# DNS queries
tshark -r capture.pcap -Y "dns.qry.name" \
  -T fields -e ip.src -e dns.qry.name

# TLS SNI (Server Name)
tshark -r capture.pcap -Y "tls.handshake.extensions_server_name" \
  -T fields -e tls.handshake.extensions_server_name | sort -u

# CSV output
tshark -r capture.pcap -Y "http.request" \
  -T fields -E header=y -E separator=, \
  -e frame.time -e ip.src -e http.host -e http.request.uri
```

### Follow Streams

```bash
# List TCP stream IDs
tshark -r capture.pcap -T fields -e tcp.stream | sort -n | uniq

# Follow TCP stream (ASCII)
tshark -r capture.pcap -q -z follow,tcp,ascii,0

# Follow stream by 5-tuple
tshark -r capture.pcap -q -z "follow,tcp,ascii,10.0.0.1:12345,10.0.0.2:80"

# Follow HTTP stream
tshark -r capture.pcap -q -z follow,http,ascii,0
```

### Statistics

```bash
# IP conversations
tshark -r capture.pcap -q -z conv,ip

# TCP conversations  
tshark -r capture.pcap -q -z conv,tcp

# Endpoints
tshark -r capture.pcap -q -z endpoints,ip

# HTTP request/response stats
tshark -r capture.pcap -q -z http,stat

# Protocol hierarchy
tshark -r capture.pcap -q -z io,phs

# Expert info (errors, warnings)
tshark -r capture.pcap -q -z expert
```

### Export Objects

```bash
# List exportable protocols
tshark --export-objects help

# Export HTTP objects (files)
mkdir http_files
tshark -r capture.pcap --export-objects http,./http_files

# Export SMB objects
tshark -r capture.pcap --export-objects smb,./smb_files
```

### Credential Extraction

```bash
# Cleartext credentials (FTP, HTTP Basic, etc.)
tshark -r capture.pcap -q -z credentials

# HTTP auth headers
tshark -r capture.pcap -Y "http.authorization" \
  -T fields -e http.authorization
```

### Decode As (Force Protocol)

```bash
# Decode port 8080 as HTTP
tshark -r capture.pcap -d tcp.port==8080,http -Y "http"

# List decode-as options
tshark -d .
```

## Output & Parsing

```bash
# JSON output
tshark -r capture.pcap -T json > packets.json

# JSON with specific protocols only
tshark -r capture.pcap -T json -j "http tcp" > http.json

# Elasticsearch format
tshark -r capture.pcap -T ek > packets.ndjson

# Pipe to jq
tshark -r capture.pcap -T json -Y "http.request" | jq '.[].layers.http'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Use `sudo` for live capture |
| Interface not found | Check `tshark -D` for correct name |
| Filter syntax error | Display filters use Wireshark syntax, not BPF |
| No output | Check if filter matches, try without `-q` |

## References

- [tshark Manual](https://www.wireshark.org/docs/man-pages/tshark.html)
- [Wireshark Display Filter Reference](https://www.wireshark.org/docs/dfref/)
- [BPF Capture Filters](https://wiki.wireshark.org/CaptureFilters)
