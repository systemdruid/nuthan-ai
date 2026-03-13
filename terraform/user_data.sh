#!/bin/bash
set -euo pipefail

# ── Install Docker ────────────────────────────────────────────────────────────
yum update -y
yum install -y docker git
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# ── Install Docker Compose v2 ─────────────────────────────────────────────────
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── Write .env for the backend container ─────────────────────────────────────
mkdir -p /app
chown ec2-user:ec2-user /app
cat > /app/.env <<EOF
ANTHROPIC_API_KEY=${anthropic_api_key}
POSTGRES_DB=${db_name}
POSTGRES_USER=${db_user}
POSTGRES_PASSWORD=${db_password}
POSTGRES_HOST=${db_host}
EOF

chmod 600 /app/.env
chown ec2-user:ec2-user /app/.env

echo "Bootstrap done. SSH in and run: cd /app && git init && git remote add origin <repo> && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build"
