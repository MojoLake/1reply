#!/usr/bin/env bash
set -euo pipefail

# Load deployment configuration
if [ ! -f ".deploy.config" ]; then
  echo "Error: .deploy.config file not found!"
  echo "Please create .deploy.config with HOST, APP_DIR, and PORT variables."
  echo "Example:"
  echo '  HOST="user@yourserver.com"'
  echo '  APP_DIR="/home/user/apps/1reply"'
  echo '  PORT="3000"'
  exit 1
fi

source .deploy.config

# Default port if not set
PORT="${PORT:-3000}"

echo "Building locally..."
npm ci
npm run build

echo "Syncing to server..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='src' \
  --exclude='.gitignore' \
  --exclude='README.md' \
  --exclude='PLAN.md' \
  --exclude='TODO.md' \
  --exclude='AGENTS.md' \
  --exclude='.deploy.config' \
  --exclude='tsconfig.tsbuildinfo' \
  .next \
  public \
  package.json \
  package-lock.json \
  next.config.ts \
  "$HOST:$APP_DIR/"

echo "Installing dependencies and restarting application..."
ssh -o StrictHostKeyChecking=accept-new "$HOST" 'bash -lc '"'"'
  set -euo pipefail
  cd "'"$APP_DIR"'"
  npm ci --production
  pm2 restart 1reply || pm2 start "npm start" --name 1reply -- -p '"$PORT"'
  pm2 save
'"'"

echo "Deployed to $HOST:$APP_DIR (port $PORT)"

