#!/bin/bash
set -euo pipefail

# ── Install Docker ────────────────────────────────────────────────────────────
yum update -y
yum install -y docker git
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF

systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# ── Install Docker Compose v2 + Buildx ───────────────────────────────────────
mkdir -p /usr/local/lib/docker/cli-plugins

curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

BUILDX_VERSION=$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest \
  | grep '"tag_name"' | cut -d'"' -f4)
curl -SL "https://github.com/docker/buildx/releases/download/$${BUILDX_VERSION}/buildx-$${BUILDX_VERSION}.linux-amd64" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx


# ── Write .env for the backend container ─────────────────────────────────────
mkdir -p /app
chown ec2-user:ec2-user /app
cat > /app/.env <<EOF
ANTHROPIC_API_KEY=${anthropic_api_key}
POSTGRES_DB=${db_name}
POSTGRES_USER=${db_user}
POSTGRES_PASSWORD=${db_password}
POSTGRES_HOST=db
GOOGLE_CLIENT_ID=${google_client_id}
GOOGLE_ANDROID_CLIENT_ID=${google_android_client_id}
EOF

chmod 600 /app/.env
chown ec2-user:ec2-user /app/.env

# ── Clone repo and start backend (run as ec2-user to avoid git safe.directory) ─
sudo -u ec2-user bash -c "
  cd /app
  git init
  git remote add origin ${git_repo_url}
  git pull origin main
  docker compose -f docker-compose.prod.yml up -d --build
"

echo "Bootstrap done — backend is starting."
