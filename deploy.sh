#!/usr/bin/env bash
set -euo pipefail

# Load deployment configuration
if [ ! -f ".deploy.config" ]; then
  echo "Error: .deploy.config file not found!"
  echo "Please create .deploy.config with HOST and APP_DIR variables."
  echo "Example:"
  echo '  HOST="user@yourserver.com"'
  echo '  APP_DIR="/home/user/apps/1reply"'
  exit 1
fi

if [ ! -f "ecosystem.config.js" ]; then
  echo "Error: ecosystem.config.js not found!"
  echo "Please copy ecosystem.config.js.example to ecosystem.config.js"
  echo "and fill in your GEMINI_API_KEY."
  exit 1
fi

source .deploy.config

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
  --exclude='*.example' \
  --exclude='.next/cache' \
  .next \
  public \
  package.json \
  package-lock.json \
  next.config.ts \
  ecosystem.config.js \
  "$HOST:$APP_DIR/"

echo "Installing dependencies and restarting application..."
ssh -o StrictHostKeyChecking=accept-new "$HOST" 'bash -lc '"'"'
  set -euo pipefail
  cd "'"$APP_DIR"'"
  npm ci --production
  pm2 delete 1reply 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
'"'"

echo "Deployed to $HOST:$APP_DIR"
