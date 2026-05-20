# Deploy

Despliegue automático de la PWA a un Hetzner con Traefik. Cada push a `main` que toque `web/`, `compose.yml` o el workflow dispara un deploy.

## Arquitectura

```
GitHub push to main
        ↓
GitHub Actions (.github/workflows/deploy.yml)
        ↓ SSH
Hetzner server (/opt/warhammer)
        ↓
git pull → docker compose up -d --build
        ↓
warhammer-web container (nginx:alpine) en red `traefik-public`
        ↓
Traefik routea Host(`${DOMAIN}`) → HTTPS con cert resolver `letsencrypt`
```

## Setup one-time en el server

```bash
# 1. Clonar el repo
mkdir -p /opt/warhammer
cd /opt/warhammer
git clone git@github.com:manucamejo/warhammer-quick-rules.git .
# (o https si no querés configurar deploy keys)

# 2. Crear el .env con el dominio
echo "DOMAIN=warhammer.tu-dominio.com" > .env

# 3. Verificar que existe la red de Traefik
docker network ls | grep traefik-public
# Si no existe: docker network create traefik-public

# 4. Primera build manual para verificar
docker compose up -d --build
docker compose logs -f
```

## Setup one-time en GitHub

En el repo, **Settings → Secrets and variables → Actions → New repository secret**:

- `SSH_HOST` — IP o hostname del Hetzner
- `SSH_PRIVATE_KEY` — clave privada (formato OpenSSH, sin passphrase) con acceso `root` al server

Para generar el par de claves:

```bash
# En tu máquina local
ssh-keygen -t ed25519 -f wh-deploy-key -N ""
# Subir wh-deploy-key.pub al server:
ssh-copy-id -i wh-deploy-key.pub root@SERVER_IP
# Copiar contenido de wh-deploy-key (el privado) al secret SSH_PRIVATE_KEY de GitHub.
```

## DNS

Apuntar el dominio al server:

```
warhammer.tu-dominio.com  →  A  →  IP_DEL_SERVER
```

Traefik se encarga del cert con Let's Encrypt la primera vez que el container está up.

## Debug

```bash
# Ver logs del container
docker compose logs -f web

# Ver labels que Traefik está leyendo
docker inspect warhammer-web | grep -A 20 Labels

# Forzar redeploy manual
gh workflow run "Deploy PWA"
# o desde Actions tab en GitHub
```
