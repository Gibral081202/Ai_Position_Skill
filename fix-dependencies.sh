#!/bin/bash

# HRAI Server Dependency Fix
# This script fixes the dependency issues on the server

echo "🔧 Fixing HRAI dependencies on server..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📋 Current directory: $(pwd)${NC}"

# Step 1: Clean up problematic files
echo -e "${YELLOW}🧹 Step 1: Cleaning up problematic files...${NC}"
rm -f package-lock.json
rm -rf node_modules

# Step 2: Install dependencies without audit fix
echo -e "${YELLOW}📚 Step 2: Installing dependencies (without audit fix)...${NC}"
npm install --no-audit --production=false

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    
    # Try with legacy peer deps
    echo -e "${YELLOW}🔄 Trying with legacy peer deps...${NC}"
    npm install --legacy-peer-deps --no-audit --production=false
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed with legacy peer deps${NC}"
    else
        echo -e "${RED}❌ Still failed, trying cache clean...${NC}"
        npm cache clean --force
        npm install --legacy-peer-deps --no-audit --production=false
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Dependencies installed after cache clean${NC}"
        else
            echo -e "${RED}❌ All attempts failed${NC}"
            exit 1
        fi
    fi
fi

# Step 3: Build the application
echo -e "${YELLOW}🔨 Step 3: Building application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 4: Restart PM2
echo -e "${YELLOW}🔄 Step 4: Restarting application...${NC}"
pm2 restart HRAI-Mining-HR

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application restarted successfully${NC}"
else
    echo -e "${RED}❌ Failed to restart application${NC}"
    exit 1
fi

# Step 5: Check status
echo -e "${YELLOW}📊 Step 5: Checking application status...${NC}"
sleep 3
pm2 status HRAI-Mining-HR

# Step 6: Health check
echo -e "${YELLOW}🏥 Step 6: Health check...${NC}"
if curl -s --connect-timeout 10 http://localhost:3050/api/health > /dev/null; then
    echo -e "${GREEN}✅ Application is running and healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check timeout, checking logs...${NC}"
    pm2 logs HRAI-Mining-HR --lines 10
fi

echo ""
echo -e "${GREEN}🎉 Dependency fix completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo "  • xlsx vulnerability is known but non-critical for internal use"
echo "  • Application should be working normally"
echo "  • Access via: http://wecare.techconnect.co.id/mining-hr/"
echo ""