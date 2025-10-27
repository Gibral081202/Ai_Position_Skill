#!/bin/bash
# Simple Fix Script - Bypass environment file issues

echo "🔧 Simple Fix for API Key Issues..."

# Go to project directory
cd /var/www/Ai_Position_Skill

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Clean old build
echo "🧹 Cleaning old build files..."
rm -rf build/
rm -rf node_modules/.cache/

# Manually set the API key for build (replace with your actual key)
echo "🔑 Setting API key for build..."
read -p "Enter your OpenAI API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ No API key provided"
    exit 1
fi

# Export the API key
export REACT_APP_OPENAI_API_KEY="$API_KEY"

echo "✅ API Key set: ${API_KEY:0:10}..."

# Build with the API key
echo "🏗️ Building application..."
NODE_ENV=production npm run build

# Check if build was successful
if [ -d "build/static/js" ] && ls build/static/js/main.*.js >/dev/null 2>&1; then
    echo "✅ Build completed successfully"
    echo "📁 Build files:"
    ls -la build/static/js/main.*.js
else
    echo "❌ Build failed or files not found"
    exit 1
fi

# Stop and start PM2
echo "🔄 Restarting application..."
pm2 delete HRAI-Mining-HR 2>/dev/null || true
sleep 2
pm2 start ecosystem.config.js --env production

# Wait for startup
sleep 5

# Check status
if pm2 list | grep -q "HRAI-Mining-HR.*online"; then
    echo "✅ Application started successfully"
    pm2 list
else
    echo "❌ Application failed to start"
    pm2 logs HRAI-Mining-HR --lines 10
fi

echo ""
echo "✅ Simple fix completed!"
echo "🌐 Try accessing: http://wecare.techconnect.co.id/mining-hr/"
echo "💡 Hard refresh your browser: Ctrl+Shift+R"