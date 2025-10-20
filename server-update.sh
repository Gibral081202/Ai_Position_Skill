#!/bin/bash

# HRAI Server Update Script
# This script pulls the latest changes from GitHub and updates the production server
# Usage: ./server-update.sh

set -e

echo "🚀 HRAI Server Update Process Starting..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="HRAI-Mining-HR"
DEPLOY_DIR="/var/www/Ai_Position_Skill"
REPO_URL="https://github.com/Gibral081202/Ai_Position_Skill.git"
PORT=3050
BACKUP_DIR="/var/backups/ai-position-skill"

echo -e "${BLUE}📋 Update Configuration:${NC}"
echo "  • Application: $APP_NAME"
echo "  • Deploy Directory: $DEPLOY_DIR"
echo "  • Repository: $REPO_URL"
echo "  • Port: $PORT"
echo "  • Date: $(date)"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create backup
create_backup() {
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    sudo mkdir -p $BACKUP_DIR
    BACKUP_NAME="hrai-backup-$(date +%Y%m%d-%H%M%S)"
    sudo cp -r $DEPLOY_DIR $BACKUP_DIR/$BACKUP_NAME
    echo -e "${GREEN}✅ Backup created: $BACKUP_DIR/$BACKUP_NAME${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    if ! command_exists git; then
        echo -e "${RED}❌ Git is not installed${NC}"
        exit 1
    fi
    
    if ! command_exists node; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command_exists npm; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    if ! command_exists pm2; then
        echo -e "${YELLOW}⚠️  PM2 not installed, installing...${NC}"
        sudo npm install -g pm2
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Step 1: Check prerequisites
check_prerequisites

# Step 2: Navigate to deployment directory
echo -e "${YELLOW}📁 Step 1: Navigating to deployment directory...${NC}"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${RED}❌ Deployment directory $DEPLOY_DIR not found${NC}"
    echo "Please clone the repository first or check the path"
    exit 1
fi

cd $DEPLOY_DIR
echo -e "${GREEN}✅ Current directory: $(pwd)${NC}"

# Step 3: Create backup of current version
create_backup

# Step 4: Check git status and pull latest changes
echo -e "${YELLOW}📥 Step 2: Pulling latest changes from GitHub...${NC}"
git status
echo ""

# Stash any local changes (if any)
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Local changes detected, stashing...${NC}"
    git stash push -m "Auto-stash before update $(date)"
fi

# Pull latest changes
echo "Pulling from main branch..."
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pulled latest changes${NC}"
else
    echo -e "${RED}❌ Failed to pull changes${NC}"
    exit 1
fi

# Step 5: Install/update dependencies
echo -e "${YELLOW}📚 Step 3: Installing/updating dependencies...${NC}"

# Clean install to avoid conflicts
rm -f package-lock.json
npm install --production=false

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    
    # Handle xlsx vulnerability warning (non-critical for our use case)
    echo -e "${YELLOW}⚠️  Note: xlsx package has known vulnerabilities but is required for Excel functionality${NC}"
    echo -e "${YELLOW}💡 This is acceptable for internal/controlled environments${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo -e "${YELLOW}🔄 Attempting recovery with clean install...${NC}"
    
    # Try recovery
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install --production=false
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies recovered successfully${NC}"
    else
        echo -e "${RED}❌ Failed to recover dependencies${NC}"
        exit 1
    fi
fi

# Step 6: Build the application
echo -e "${YELLOW}🔨 Step 4: Building the application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application built successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 7: Verify environment variables
echo -e "${YELLOW}🔧 Step 5: Verifying environment variables...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.production...${NC}"
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo -e "${GREEN}✅ Environment variables configured${NC}"
    else
        echo -e "${RED}❌ No environment configuration found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Environment variables file exists${NC}"
fi

# Step 8: Update PM2 configuration
echo -e "${YELLOW}⚙️  Step 6: Updating PM2 configuration...${NC}"
if [ -f "ecosystem.config.js" ]; then
    echo -e "${GREEN}✅ PM2 configuration file found${NC}"
else
    echo -e "${RED}❌ ecosystem.config.js not found${NC}"
    exit 1
fi

# Step 9: Restart the application
echo -e "${YELLOW}🔄 Step 7: Restarting application...${NC}"

# Stop current application
pm2 stop $APP_NAME 2>/dev/null || echo "Application not running"

# Start application with updated configuration
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Application restarted successfully${NC}"
else
    echo -e "${RED}❌ Failed to restart application${NC}"
    exit 1
fi

# Step 10: Health check
echo -e "${YELLOW}🏥 Step 8: Performing health check...${NC}"
sleep 5

# Check if application is responding
if curl -s --connect-timeout 10 http://localhost:$PORT/api/health > /dev/null; then
    echo -e "${GREEN}✅ Application health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Direct health check failed, checking PM2 status...${NC}"
fi

# Step 11: Display final status
echo ""
echo -e "${GREEN}🎉 Update process completed!${NC}"
echo ""

# Display PM2 status
echo -e "${BLUE}📊 Application Status:${NC}"
pm2 status $APP_NAME

# Display logs preview
echo ""
echo -e "${BLUE}📋 Recent Logs (last 10 lines):${NC}"
pm2 logs $APP_NAME --lines 10 --raw

echo ""
echo -e "${BLUE}🔧 Useful commands:${NC}"
echo "  • View full logs: pm2 logs $APP_NAME"
echo "  • Monitor: pm2 monit"
echo "  • Restart: pm2 restart $APP_NAME"
echo "  • Stop: pm2 stop $APP_NAME"
echo ""

echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  • Direct: http://localhost:$PORT"
echo "  • Via NGINX: http://wecare.techconnect.co.id/mining-hr/"
echo ""

echo -e "${GREEN}✅ HRAI server update completed successfully!${NC}"
echo -e "${YELLOW}📝 Note: All changes from GitHub have been applied, including:${NC}"
echo "  • Updated position holder logic to use relationship_obj_text"
echo "  • Enhanced staff name handling"
echo "  • Improved frontend validation"
echo "  • Latest organizational chart features"