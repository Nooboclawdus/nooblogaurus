# Docker

> Container runtime for packaging and running applications. Essential for pentest lab environments.

## Quickstart

```bash
# Run interactive container
docker run --rm -it alpine sh

# Run service in background
docker run -d --name web -p 8080:80 nginx

# Exec into running container
docker exec -it web sh

# View logs
docker logs -f web

# Stop and remove
docker stop web && docker rm web

# Compose stack
docker compose up -d
docker compose down
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Image | Read-only template (base + layers) |
| Container | Running instance of an image |
| Volume | Persistent storage (survives container removal) |
| Bind mount | Host directory mounted in container |
| Network | Container connectivity layer |
| Compose | Multi-container orchestration |

## Syntax

```text
docker <object> <command> [options]
docker compose <command> [options]
```

## Options

### `docker run`

| Option | Description |
|--------|-------------|
| `--rm` | Remove on exit |
| `-it` | Interactive TTY |
| `-d` | Detached (background) |
| `--name <name>` | Container name |
| `-p host:container` | Publish port |
| `-e VAR=value` | Environment variable |
| `-v src:dst` | Volume/bind mount |
| `-w /path` | Working directory |
| `--network <net>` | Attach to network |
| `--entrypoint sh` | Override entrypoint |

### Security Options

| Option | Description |
|--------|-------------|
| `--user uid:gid` | Run as non-root |
| `--read-only` | Read-only filesystem |
| `--cap-drop ALL` | Drop all capabilities |
| `--security-opt no-new-privileges` | Prevent privilege escalation |

## Recipes

### Image Management

```bash
# Pull image
docker pull kalilinux/kali-rolling

# List images
docker images

# Remove image
docker rmi nginx:latest

# Build from Dockerfile
docker build -t myapp:1.0 .

# Tag for registry
docker tag myapp:1.0 registry.example.com/myapp:1.0

# Push to registry
docker push registry.example.com/myapp:1.0
```

### Container Lifecycle

```bash
# List running
docker ps

# List all (including stopped)
docker ps -a

# Stop / Start / Restart
docker stop <name>
docker start <name>
docker restart <name>

# Remove container
docker rm <name>

# Force remove running
docker rm -f <name>
```

### Exec & Debug

```bash
# Shell into running container
docker exec -it <name> sh
docker exec -it <name> /bin/bash

# Run command
docker exec <name> whoami

# Debug failed container
docker logs <name>
docker inspect <name> | jq '.[0].State'

# Override entrypoint for debug
docker run --rm -it --entrypoint sh nginx
```

### Volumes & Mounts

```bash
# Named volume (persistent)
docker volume create data
docker run -v data:/app/data myapp

# Bind mount (host path)
docker run -v $(pwd):/work -w /work myapp

# Read-only bind mount
docker run -v $(pwd):/work:ro myapp

# List volumes
docker volume ls

# Remove unused volumes
docker volume prune
```

### Networking

```bash
# Create network
docker network create pentest

# Run on network
docker run -d --name target --network pentest vulnerable-app
docker run --rm -it --network pentest kali sh

# List networks
docker network ls

# Inspect network
docker network inspect pentest
```

### Docker Compose

```bash
# Start stack
docker compose up -d

# View logs
docker compose logs -f

# Exec into service
docker compose exec <service> sh

# Run one-off command
docker compose run --rm <service> <cmd>

# Rebuild after changes
docker compose up -d --build

# Stop stack
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Pentest Lab Examples

```bash
# DVWA
docker run -d -p 80:80 vulnerables/web-dvwa

# Juice Shop
docker run -d -p 3000:3000 bkimminich/juice-shop

# Metasploitable
docker run -d --name metasploitable tleemcjr/metasploitable2

# Kali Linux
docker run -it --name kali kalilinux/kali-rolling /bin/bash

# Custom network for lab
docker network create lab
docker run -d --name target --network lab vuln-app
docker run -it --network lab kalilinux/kali-rolling
```

### Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Nuclear option (everything unused)
docker system prune -a --volumes
```

## Output & Parsing

```bash
# Custom format
docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'

# JSON inspect
docker inspect <name> | jq '.[0].NetworkSettings.IPAddress'

# Get container IP
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <name>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | Add user to docker group, or use sudo |
| Port already in use | Check `ss -tlnp`, use different host port |
| Container exits immediately | Check `docker logs`, override entrypoint |
| Network issues | Use user-defined network for DNS |
| Disk full | Run `docker system prune` |

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Awesome Docker](https://github.com/veggiemonk/awesome-docker)
