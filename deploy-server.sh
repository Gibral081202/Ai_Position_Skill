#!/bin/bash

# 🚀 HRAI Mining HR - Server Deployment Script
# This script handles the complete deployment process on the production server

set -e  # Exit on any error

echo "🚀 Starting HRAI Mining HR deployment process..."
echo "📅 Deployment started at: $(date)"

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're on the server
if [ ! -d "/var/www/Ai_Position_Skill" ]; then
    print_error "This script must be run on the production server at /var/www/Ai_Position_Skill"
    exit 1
fi

cd /var/www/Ai_Position_Skill

print_info "Current directory: $(pwd)"
print_info "Current user: $(whoami)"

# 1. Git pull latest changes
print_info "📥 Pulling latest changes from GitHub..."
git pull origin main
if [ $? -eq 0 ]; then
    print_status "Git pull completed successfully"
else
    print_error "Git pull failed"
    exit 1
fi

# 2. Check Node.js version
print_info "🔍 Checking Node.js version..."
node_version=$(node --version)
print_info "Node.js version: $node_version"

# 3. Install/update dependencies
print_info "📦 Installing/updating dependencies..."
npm ci --production=false
if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# 4. Check environment file
print_info "🔧 Checking environment configuration..."
if [ -f ".env.production" ]; then
    print_status "Production environment file found"
    
    # Verify critical environment variables
    if grep -q "REACT_APP_OPENAI_API_KEY" .env.production; then
        print_status "OpenAI API key configured"
    else
        print_warning "OpenAI API key not found in .env.production"
    fi
    
    if grep -q "PUBLIC_URL=/mining-hr" .env.production; then
        print_status "PUBLIC_URL correctly configured for NGINX"
    else
        print_warning "PUBLIC_URL may not be correctly configured"
    fi
else
    print_error ".env.production file not found"
    print_info "Creating .env.production from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        print_warning "Please edit .env.production with actual production values"
    else
        print_error "No .env.example template found"
        exit 1
    fi
fi

# 5. Build the application
print_info "🏗️  Building React application..."
# Load environment variables for the build process
if [ -f ".env.production" ]; then
    print_info "Loading environment variables for build..."
    export $(grep -v '^#' .env.production | xargs)
fi
NODE_ENV=production npm run build
if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
    
    # Check build directory
    if [ -d "build" ]; then
        build_size=$(du -sh build | cut -f1)
        print_info "Build directory size: $build_size"
        print_status "Build directory created successfully"
    else
        print_error "Build directory not found after build"
        exit 1
    fi
else
    print_error "Build failed"
    exit 1
fi

# 6. Check PM2 status
print_info "🔍 Checking PM2 status..."
pm2 show HRAI-Mining-HR > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "PM2 app 'HRAI-Mining-HR' exists"
    
    # Restart the application
    print_info "🔄 Restarting PM2 application..."
    pm2 restart HRAI-Mining-HR
    if [ $? -eq 0 ]; then
        print_status "PM2 application restarted successfully"
    else
        print_error "Failed to restart PM2 application"
        exit 1
    fi
else
    print_warning "PM2 app 'HRAI-Mining-HR' not found, starting new instance..."
    pm2 start ecosystem.config.js
    if [ $? -eq 0 ]; then
        print_status "PM2 application started successfully"
    else
        print_error "Failed to start PM2 application"
        exit 1
    fi
fi

# 7. Wait for application to be ready
print_info "⏳ Waiting for application to be ready..."
sleep 10

# 8. Health check
print_info "🏥 Performing health check..."
health_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3050/api/health)
if [ "$health_response" = "200" ]; then
    print_status "Health check passed (HTTP $health_response)"
else
    print_warning "Health check returned HTTP $health_response"
fi

# 9. Check PM2 status after restart
print_info "📊 Final PM2 status check..."
pm2 status HRAI-Mining-HR
pm2 logs HRAI-Mining-HR --lines 5

# 10. Save PM2 configuration
print_info "💾 Saving PM2 configuration..."
pm2 save

print_status "🎉 Deployment completed successfully!"
print_info "📍 Application should be accessible at: https://wecare.techconnect.co.id/mining-hr/"
print_info "🔧 API endpoint: https://wecare.techconnect.co.id/mining-hr/api/"
print_info "📅 Deployment completed at: $(date)"

echo ""
echo "🚀 Next steps:"
echo "1. Test the application in your browser"
echo "2. Check PM2 logs if needed: pm2 logs HRAI-Mining-HR"
echo "3. Monitor application: pm2 status"
echo ""