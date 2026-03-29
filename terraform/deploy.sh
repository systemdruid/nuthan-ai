#!/bin/bash
# deploy.sh — pull latest backend code and restart containers on the EC2 instance.
# Usage: ./deploy.sh [path-to-pem]   (defaults to ~/.ssh/<key_pair_name>.pem)
set -euo pipefail

cd "$(dirname "$0")"

BACKEND_IP=$(terraform output -raw backend_ip)
KEY_PATH=${1:-~/.ssh/$(terraform output -raw key_pair_name 2>/dev/null || echo "aws-keypair").pem}

SSH_OPTS="-i $KEY_PATH -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"

echo "Deploying to $BACKEND_IP using key $KEY_PATH …"

# Wait for user_data bootstrap to finish (cloud-init writes "Bootstrap done" when complete)
echo "Waiting for instance bootstrap to complete …"
for i in $(seq 1 30); do
  STATUS=$(ssh $SSH_OPTS ec2-user@"$BACKEND_IP" \
    "grep -c 'Bootstrap done' /var/log/cloud-init-output.log 2>/dev/null || echo 0" 2>/dev/null || echo 0)
  if [ "$STATUS" -ge 1 ]; then
    echo "Bootstrap complete."
    break
  fi
  echo "  ($i/30) Still bootstrapping — waiting 15s …"
  sleep 15
  if [ "$i" -eq 30 ]; then
    echo "Timed out waiting for bootstrap. Check: ssh $SSH_OPTS ec2-user@$BACKEND_IP 'tail -50 /var/log/cloud-init-output.log'"
    exit 1
  fi
done

ssh $SSH_OPTS ec2-user@"$BACKEND_IP" bash <<'REMOTE'
set -euo pipefail
cd /app
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
echo "Deploy complete."
REMOTE

echo "Done — backend at http://$BACKEND_IP:8000"
