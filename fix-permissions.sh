#!/bin/bash

# Fix permissions for HRAI deployment
# Run this script to resolve the npm install permission issues

set -e

echo "🔧 Fixing permissions for HRAI deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/Ai_Position_Skill"
USER="Gibral"

echo -e "${YELLOW}📋 Project Directory: $PROJECT_DIR${NC}"
echo -e "${YELLOW}👤 User: $USER${NC}"
echo ""

# Check if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directory $PROJECT_DIR does not exist${NC}"
    exit 1
fi

# Fix ownership
echo -e "${YELLOW}🔐 Step 1: Fixing directory ownership...${NC}"
sudo chown -R $USER:$USER $PROJECT_DIR

# Set proper permissions
echo -e "${YELLOW}📁 Step 2: Setting directory permissions...${NC}"
sudo chmod -R 755 $PROJECT_DIR

# Fix npm cache permissions if needed
echo -e "${YELLOW}🗂️  Step 3: Fixing npm cache permissions...${NC}"
sudo chown -R $USER:$USER /home/$USER/.npm 2>/dev/null || true

# Clear any existing node_modules that might have wrong permissions
echo -e "${YELLOW}🧹 Step 4: Cleaning up old node_modules...${NC}"
if [ -d "$PROJECT_DIR/node_modules" ]; then
    sudo rm -rf $PROJECT_DIR/node_modules
fi

# Clear package-lock.json if it exists with wrong permissions
if [ -f "$PROJECT_DIR/package-lock.json" ]; then
    sudo rm -f $PROJECT_DIR/package-lock.json
fi

echo -e "${GREEN}✅ Permissions fixed successfully!${NC}"
echo ""
echo -e "${YELLOW}🚀 Now you can run:${NC}"
echo "  cd $PROJECT_DIR"
echo "  npm install"
echo "  npm run build"
echo "  npm run server"
echo ""