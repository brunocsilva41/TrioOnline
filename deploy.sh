#!/bin/bash

# --- PROJECT TRINITY - Automated Deploy Script ---
# This script updates the code, builds the project with RAM optimization,
# and restarts the services using PM2.

PROJECT_DIR="/home/ubuntu/TrioOnline"
BRANCH="sobe-nova-visu-a-pedido-dos-fans"

echo "🚀 Starting deployment of $BRANCH..."

cd $PROJECT_DIR || { echo "❌ Error: Project directory not found"; exit 1; }

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# 2. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 3. Apply database migrations
echo "🗄️ Updating database schema..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trinity?schema=public" pnpm --filter db exec prisma db push

# 4. Build with RAM optimization
echo "🏗️ Building project (this might take a few minutes)..."
export NODE_OPTIONS="--max-old-space-size=800"
pnpm run build

# 5. Restart services with PM2
echo "🔄 Restarting services..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trinity?schema=public" pm2 start ecosystem.config.js --update-env
pm2 save

echo "✅ Deployment completed successfully!"
pm2 status
