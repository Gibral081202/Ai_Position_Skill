#!/bin/bash

# Quick fix for React subdirectory deployment
# This script rebuilds the app with correct paths and restarts the server

set -e

echo "🔧 Fixing React app for subdirectory deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/Ai_Position_Skill"

echo -e "${YELLOW}📁 Working in: $PROJECT_DIR${NC}"

# Navigate to project directory
cd $PROJECT_DIR

# Pull latest changes (if any)
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin main

# Rebuild with correct paths
echo -e "${YELLOW}🔨 Rebuilding with subdirectory paths...${NC}"
PUBLIC_URL=/mining-hr npm run build

# Restart PM2
echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart HRAI-Mining-HR

# Check status
echo -e "${YELLOW}📊 Checking application status...${NC}"
pm2 status HRAI-Mining-HR

echo -e "${GREEN}✅ Fix completed!${NC}"
echo ""
echo -e "${YELLOW}🌐 Your application should now work at:${NC}"
echo "  https://wecare.techconnect.co.id/mining-hr/"
echo ""
echo -e "${YELLOW}🧪 Test the application:${NC}"
echo "  curl https://wecare.techconnect.co.id/mining-hr/"
echo ""