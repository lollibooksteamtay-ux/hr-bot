#!/bin/bash
set -e

VPS="root@103.97.127.228"
SSH_KEY="$HOME/.ssh/shotsmith_vps"
PORT=2018
REMOTE_DIR="~/recruit-app"

echo "📦 Syncing files..."
rsync -avz --progress \
  -e "ssh -p $PORT -i $SSH_KEY" \
  --exclude node_modules \
  --exclude .next \
  --exclude .env.local \
  --exclude 'data/' \
  ~/vibe-apps/recruit-app/ \
  $VPS:$REMOTE_DIR/

echo "🔨 Building on VPS..."
ssh -p $PORT -i $SSH_KEY $VPS "
  cd $REMOTE_DIR
  export PATH=/root/.nvm/versions/node/v22.22.2/bin:\$PATH
  npm install
  npm run build
  pm2 restart recruit-app 2>/dev/null || pm2 start npm --name recruit-app -- start
  pm2 save
"

echo "✅ Deploy xong!"
