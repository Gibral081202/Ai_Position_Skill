#!/bin/bash

# HRAI Deployment Script for GCP Server
# Usage: ./deploy.sh

set -e

echo "🚀 Starting HRAI deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="HRAI-Mining-HR"
DEPLOY_DIR="/var/www/ai-position-skill"
REPO_URL="https://github.com/Gibral081202/Ai_Position_Skill.git"
PORT=3050

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  • Application: $APP_NAME"
echo "  • Deploy Directory: $DEPLOY_DIR"
echo "  • Repository: $REPO_URL"
echo "  • Port: $PORT"
echo ""

# Check if we're running as the correct user
if [ "$USER" != "Gibral" ]; then
    echo -e "${RED}❌ This script should be run as user 'Gibral'${NC}"
    exit 1
fi

# Step 1: Clone or update repository
echo -e "${YELLOW}📥 Step 1: Cloning/updating repository...${NC}"
if [ -d "$DEPLOY_DIR" ]; then
    echo "Directory exists, updating..."
    cd $DEPLOY_DIR
    git pull origin main
else
    echo "Cloning repository..."
    sudo mkdir -p $DEPLOY_DIR
    sudo chown Gibral:Gibral $DEPLOY_DIR
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

# Step 2: Install Node.js if not present
echo -e "${YELLOW}📦 Step 2: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node --version)"
fi

# Step 3: Install dependencies
echo -e "${YELLOW}📚 Step 3: Installing dependencies...${NC}"
npm install

# Step 4: Build the application
echo -e "${YELLOW}🔨 Step 4: Building the application...${NC}"
npm run build

# Step 5: Install PM2 for process management
echo -e "${YELLOW}⚙️  Step 5: Setting up PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed: $(pm2 --version)"
fi

# Step 6: Create PM2 ecosystem file
echo -e "${YELLOW}📝 Step 6: Creating PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'server.js',
    cwd: '$DEPLOY_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: '/var/log/pm2/$APP_NAME-error.log',
    out_file: '/var/log/pm2/$APP_NAME-out.log',
    log_file: '/var/log/pm2/$APP_NAME-combined.log',
    time: true
  }]
};
EOF

# Step 7: Create log directory
echo -e "${YELLOW}📋 Step 7: Setting up logging...${NC}"
sudo mkdir -p /var/log/pm2
sudo chown Gibral:Gibral /var/log/pm2

# Step 8: Start the application with PM2
echo -e "${YELLOW}🚀 Step 8: Starting the application...${NC}"
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep -E '^sudo' | sh || true

# Step 9: Verify deployment
echo -e "${YELLOW}✅ Step 9: Verifying deployment...${NC}"
sleep 5

if curl -s http://localhost:$PORT/api/health > /dev/null; then
    echo -e "${GREEN}✅ Application is running successfully!${NC}"
    echo -e "${GREEN}🌐 Access your application at: http://wecare.techconnect.co.id/mining-hr/${NC}"
else
    echo -e "${RED}❌ Application health check failed${NC}"
    echo "Checking PM2 logs..."
    pm2 logs $APP_NAME --lines 20
fi

# Display final status
echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 status $APP_NAME

echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "  • View logs: pm2 logs $APP_NAME"
echo "  • Restart app: pm2 restart $APP_NAME"
echo "  • Stop app: pm2 stop $APP_NAME"
echo "  • Monitor: pm2 monit"
echo ""
echo -e "${YELLOW}🌐 Access URLs:${NC}"
echo "  • Direct: http://localhost:$PORT"
echo "  • Via NGINX: http://wecare.techconnect.co.id/mining-hr/"
echo ""