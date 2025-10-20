#!/bin/bash

# Quick Fix Script for HRAI Deployment Configuration Issues
# This script fixes the configuration mismatches found in the deployment

set -e

echo "🔧 HRAI Quick Fix - Resolving deployment configuration issues..."

APP_NAME="HRAI-Mining-HR"
DEPLOY_DIR="/var/www/ai-position-skill"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}❌ ecosystem.config.js not found. Please run this from the project directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Applying configuration fixes...${NC}"

# Stop the current application if running
echo -e "${YELLOW}🛑 Stopping application...${NC}"
pm2 stop $APP_NAME 2>/dev/null || echo "Application not running"
pm2 delete $APP_NAME 2>/dev/null || echo "Application not in PM2"

# Copy fixed ecosystem.config.js to deployment directory
echo -e "${YELLOW}📝 Updating PM2 configuration...${NC}"
if [ -d "$DEPLOY_DIR" ]; then
    cp ecosystem.config.js $DEPLOY_DIR/
    echo "✅ Updated ecosystem.config.js"
else
    echo -e "${RED}❌ Deployment directory $DEPLOY_DIR not found${NC}"
    exit 1
fi

# Setup environment variables
echo -e "${YELLOW}🔧 Setting up environment variables...${NC}"
cat > $DEPLOY_DIR/.env << EOF
NODE_ENV=production
PORT=3050
REACT_APP_GEMINI_API_KEY=AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4
EOF

chmod 600 $DEPLOY_DIR/.env
chown Gibral:Gibral $DEPLOY_DIR/.env
echo "✅ Environment variables configured"

# Restart the application
echo -e "${YELLOW}🚀 Starting application with fixed configuration...${NC}"
cd $DEPLOY_DIR
pm2 start ecosystem.config.js
pm2 save

echo ""
echo -e "${GREEN}🎉 Quick fix completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 status $APP_NAME

echo ""
echo -e "${YELLOW}🔧 What was fixed:${NC}"
echo "  ✅ Path mismatch between deploy.sh and ecosystem.config.js"
echo "  ✅ Log directory configuration aligned"
echo "  ✅ Environment variables properly configured"
echo "  ✅ NGINX configuration paths corrected"
echo ""
echo -e "${YELLOW}🌐 Your application should now be accessible at:${NC}"
echo "  • Direct: http://localhost:3050"
echo "  • Via NGINX: http://wecare.techconnect.co.id/mining-hr/"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "  • Update your NGINX config with the corrected nginx-config-snippet.conf"
echo "  • Consider changing the Gemini API key in $DEPLOY_DIR/.env for production"
echo "  • Run 'sudo systemctl reload nginx' after updating NGINX config"