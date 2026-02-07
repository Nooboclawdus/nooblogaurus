# Hashcat

> GPU-accelerated password cracker for offline hash recovery. Use only on hashes you're authorized to test.

## Quickstart

```bash
# Identify hash mode
hashcat --example-hashes | grep -i "ntlm\|md5\|sha"
hashcat -h | grep -i bcrypt

# Wordlist attack
hashcat -m <mode> -a 0 hashes.txt wordlist.txt

# Wordlist + rules (best results)
hashcat -m <mode> -a 0 hashes.txt wordlist.txt -r rules/best64.rule

# Mask attack (8 chars, lower + digits)
hashcat -m <mode> -a 3 hashes.txt '?l?l?l?l?l?d?d?d'

# Show cracked
hashcat -m <mode> --show hashes.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Hash mode (`-m`) | Algorithm identifier (see `-h` or `--example-hashes`) |
| Attack mode (`-a`) | 0=wordlist, 1=combinator, 3=mask, 6/7=hybrid |
| Rules | Transform wordlist entries (append, case, leet) |
| Masks | Pattern-based generation (`?l`=lower, `?d`=digit) |
| Potfile | Cache of cracked hashes (`~/.hashcat/hashcat.potfile`) |

## Syntax

```text
hashcat -m <mode> -a <attack> [options] <hashes> <input>
```

## Common Hash Modes

| Mode | Algorithm |
|------|-----------|
| 0 | MD5 |
| 100 | SHA1 |
| 1400 | SHA256 |
| 1700 | SHA512 |
| 1000 | NTLM |
| 3200 | bcrypt |
| 5600 | NetNTLMv2 |
| 13100 | Kerberos TGS-REP (krb5tgs) |
| 18200 | Kerberos AS-REP (krb5asrep) |
| 22000 | WPA-PBKDF2-PMKID+EAPOL |

## Options

### Core

| Option | Description |
|--------|-------------|
| `-m <mode>` | Hash type |
| `-a <mode>` | Attack mode (0, 1, 3, 6, 7) |
| `-r <file>` | Rules file |
| `-O` | Optimized kernels (faster, limited length) |
| `-w 3` | Workload profile (1-4, higher = faster) |

### Mask Charsets

| Charset | Description |
|---------|-------------|
| `?l` | Lowercase (a-z) |
| `?u` | Uppercase (A-Z) |
| `?d` | Digits (0-9) |
| `?s` | Special (!@#$...) |
| `?a` | All printable |
| `-1 ?l?d` | Custom charset 1 |

### Output

| Option | Description |
|--------|-------------|
| `--show` | Show cracked (from potfile) |
| `--left` | Show uncracked |
| `-o <file>` | Output cracked to file |
| `--outfile-format 2` | Just plaintext |
| `--username` | Ignore username field in hash file |

### Session

| Option | Description |
|--------|-------------|
| `--session <name>` | Name the session |
| `--restore` | Resume session |
| `--status` | Show progress |
| `--status-timer 10` | Status every N seconds |

## Recipes

### Wordlist Attacks

```bash
# Basic wordlist
hashcat -m 1000 hashes.txt rockyou.txt

# Wordlist + best rules
hashcat -m 1000 hashes.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule

# Multiple rule files
hashcat -m 1000 hashes.txt rockyou.txt -r rules/best64.rule -r rules/toggles1.rule

# Large wordlist, optimized
hashcat -m 1000 -O -w 3 hashes.txt rockyou.txt
```

### Mask Attacks

```bash
# 8 lowercase letters
hashcat -m 1000 -a 3 hashes.txt '?l?l?l?l?l?l?l?l'

# Upper + 5 lower + 2 digits (Password1)
hashcat -m 1000 -a 3 hashes.txt '?u?l?l?l?l?l?l?d?d'

# Custom charset (lowercase + digits only)
hashcat -m 1000 -a 3 -1 '?l?d' hashes.txt '?1?1?1?1?1?1?1?1'

# Increment length (6-10 chars)
hashcat -m 1000 -a 3 hashes.txt '?a?a?a?a?a?a?a?a?a?a' \
  --increment --increment-min 6 --increment-max 10
```

### Hybrid Attacks

```bash
# Wordlist + 4 digits appended
hashcat -m 1000 -a 6 hashes.txt wordlist.txt '?d?d?d?d'

# 2 digits prepended + wordlist
hashcat -m 1000 -a 7 hashes.txt '?d?d' wordlist.txt

# Wordlist + year
hashcat -m 1000 -a 6 hashes.txt wordlist.txt '20?d?d'
```

### Common Hash Types

```bash
# NTLM (Windows)
hashcat -m 1000 -a 0 ntlm.txt rockyou.txt -r best64.rule

# NetNTLMv2 (Responder captures)
hashcat -m 5600 -a 0 netntlmv2.txt rockyou.txt

# Kerberoasting (TGS-REP)
hashcat -m 13100 -a 0 krb5tgs.txt rockyou.txt

# AS-REP Roasting
hashcat -m 18200 -a 0 krb5asrep.txt rockyou.txt

# MD5 (web apps)
hashcat -m 0 -a 0 md5.txt rockyou.txt

# SHA256
hashcat -m 1400 -a 0 sha256.txt rockyou.txt

# bcrypt (slow!)
hashcat -m 3200 -a 0 bcrypt.txt small_wordlist.txt -w 3
```

### Session Management

```bash
# Start named session
hashcat --session crack1 -m 1000 -a 0 hashes.txt wordlist.txt

# Resume session
hashcat --session crack1 --restore

# Check status
hashcat --session crack1 --status
```

## Output & Parsing

```bash
# Show all cracked
hashcat -m 1000 --show hashes.txt

# Show uncracked
hashcat -m 1000 --left hashes.txt

# Output to file (hash:plain)
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -o cracked.txt

# Just plaintext
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -o cracked.txt --outfile-format 2

# Separate potfile per engagement
hashcat -m 1000 -a 0 hashes.txt wordlist.txt --potfile-path ./client.pot
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Token length exception" | Wrong hash mode, check format |
| "Separator unmatched" | Use `-p` to set separator, or `--username` |
| Already in potfile | Use `--show`, or clear `~/.hashcat/hashcat.potfile` |
| GPU not detected | Run `hashcat -I`, check drivers |
| Out of memory | Use `-w 2` or lower |

## References

- [Hashcat Wiki](https://hashcat.net/wiki/)
- [Hashcat Example Hashes](https://hashcat.net/wiki/doku.php?id=example_hashes)
- [Rule-based Attack](https://hashcat.net/wiki/doku.php?id=rule_based_attack)
