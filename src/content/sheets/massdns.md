# massdns

> High-performance DNS stub resolver for bulk lookups.

## Quickstart

```bash
# Resolve subdomain list
massdns -r resolvers.txt -t A -o S -w results.txt subs.txt

# Simple resolve
massdns -r resolvers.txt -t A subs.txt

# With output parsing
massdns -r resolvers.txt -t A -o S subs.txt | awk '{print $1}' | sed 's/.$//'
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Stub resolver | Sends queries to upstream resolvers |
| Bulk lookups | Handle millions of queries fast |
| Resolvers | List of DNS servers to query |

## Syntax

```text
massdns [options] <domainlist>
```

## Options

### Input/Output

| Option | Description |
|--------|-------------|
| `-r <file>` | Resolver list (required) |
| `-w <file>` | Output file |
| `-o <format>` | Output format (S, F, J, L) |
| `-t <type>` | Record type (A, AAAA, CNAME, etc.) |

### Output Formats

| Format | Description |
|--------|-------------|
| `S` | Simple (just answers) |
| `F` | Full (all sections) |
| `J` | JSON (ndjson) |
| `L` | List (one per line) |

### Performance

| Option | Description |
|--------|-------------|
| `-s <n>` | Concurrent queries (default 10000) |
| `-c <n>` | Resolve count per domain |
| `--processes <n>` | Parallel processes |

### Filtering

| Option | Description |
|--------|-------------|
| `--filter <expr>` | Filter results |
| `--root` | Retry with root servers |

## Recipes

### Basic Resolution

```bash
# Resolve A records
massdns -r resolvers.txt -t A subs.txt

# With output file
massdns -r resolvers.txt -t A -o S -w results.txt subs.txt

# Simple format
massdns -r resolvers.txt -t A -o S subs.txt
```

### Record Types

```bash
# A records
massdns -r resolvers.txt -t A subs.txt

# AAAA records
massdns -r resolvers.txt -t AAAA subs.txt

# CNAME records
massdns -r resolvers.txt -t CNAME subs.txt

# MX records
echo "target.com" | massdns -r resolvers.txt -t MX

# ANY (all records)
massdns -r resolvers.txt -t ANY subs.txt
```

### Output Formats

```bash
# Simple (just answers)
massdns -r resolvers.txt -t A -o S subs.txt

# Full (detailed)
massdns -r resolvers.txt -t A -o F subs.txt

# JSON
massdns -r resolvers.txt -t A -o J subs.txt

# List format
massdns -r resolvers.txt -t A -o L subs.txt
```

### Performance Tuning

```bash
# High concurrency
massdns -r resolvers.txt -t A -s 50000 subs.txt

# Lower for stability
massdns -r resolvers.txt -t A -s 5000 subs.txt

# Multiple attempts per domain
massdns -r resolvers.txt -t A -c 3 subs.txt
```

### Resolver List

```bash
# Create resolver list
cat > resolvers.txt << EOF
8.8.8.8
8.8.4.4
1.1.1.1
1.0.0.1
9.9.9.9
EOF

# Use public resolvers
# https://public-dns.info/
```

### Pipeline Integration

```bash
# subfinder → massdns
subfinder -d target.com -silent | massdns -r resolvers.txt -t A -o S

# Extract live hosts
massdns -r resolvers.txt -t A -o S subs.txt | \
  awk '{print $1}' | sed 's/.$//' | sort -u

# Full pipeline
subfinder -d target.com -silent | \
  massdns -r resolvers.txt -t A -o S | \
  awk '{print $1}' | sed 's/.$//' | \
  httpx -silent
```

### Parse Output

```bash
# Extract resolved domains
massdns -r resolvers.txt -t A -o S subs.txt | awk '{print $1}' | sed 's/.$//'

# Extract IPs
massdns -r resolvers.txt -t A -o S subs.txt | awk '{print $3}'

# Domain to IP mapping
massdns -r resolvers.txt -t A -o S subs.txt | awk '{gsub(/\.$/, "", $1); print $1, $3}'

# JSON parsing
massdns -r resolvers.txt -t A -o J subs.txt | jq -r '.name'
```

### Filter Dead/Wildcard

```bash
# Get only resolved
massdns -r resolvers.txt -t A -o S subs.txt | grep -v "NXDOMAIN"

# Unique resolved domains
massdns -r resolvers.txt -t A -o S subs.txt | \
  awk '{print $1}' | sed 's/.$//' | sort -u
```

## Output & Parsing

```bash
# Simple output parsing
massdns -r resolvers.txt -t A -o S -w results.txt subs.txt
cat results.txt | awk '{print $1}' | sed 's/.$//'

# JSON output
massdns -r resolvers.txt -t A -o J subs.txt > results.json
cat results.json | jq -r '.name'

# Extract unique IPs
awk '{print $3}' results.txt | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No results | Check resolver list, domain format |
| Slow | Increase `-s`, use more resolvers |
| Many timeouts | Reduce `-s`, better resolvers |
| Wildcards | Filter common IPs, use dnsx |

## References

- [massdns GitHub](https://github.com/blechschmidt/massdns)
