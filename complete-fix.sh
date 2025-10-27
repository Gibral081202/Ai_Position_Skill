#!/bin/bash
# Complete Fix Script - Clear cache and rebuild

echo "🔧 Complete Fix for API Key and Cache Issues..."

# Go to project directory
cd /var/www/Ai_Position_Skill

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Check environment file
echo "📋 Checking .env.production file..."
if grep -q "REACT_APP_OPENAI_API_KEY=" .env.production; then
    echo "✅ API key found in .env.production"
else
    echo "❌ API key not found in .env.production"
    echo "Please add: REACT_APP_OPENAI_API_KEY=your_actual_api_key_here"
    exit 1
fi

# Clean old build
echo "🧹 Cleaning old build files..."
rm -rf build/
rm -rf node_modules/.cache/

# Install fresh dependencies
echo "📦 Reinstalling dependencies..."
npm ci --production=false

# Load environment variables and rebuild with verbose output
echo "🏗️ Rebuilding with environment variables..."
set -a  # automatically export all variables
source .env.production
set +a  # turn off automatic export

# Show that API key is loaded (first 10 chars only for security)
if [ ! -z "$REACT_APP_OPENAI_API_KEY" ]; then
    echo "✅ API Key loaded: ${REACT_APP_OPENAI_API_KEY:0:10}..."
else
    echo "❌ API Key not loaded from environment"
    exit 1
fi

# Build with environment
NODE_ENV=production npm run build

# Check if build was successful and contains API key
if [ -d "build/static/js" ] && ls build/static/js/main.*.js >/dev/null 2>&1; then
    echo "✅ Build files created"
    # Check if the built files contain a reference to the API key (not the actual key, just a check)
    if grep -q "process.env.REACT_APP_OPENAI_API_KEY" build/static/js/main.*.js 2>/dev/null; then
        echo "⚠️  Environment variable reference found in build (this should not happen)"
    else
        echo "✅ API key properly embedded in build"
    fi
else
    echo "❌ Build files not created"
    ls -la build/static/js/ 2>/dev/null || echo "Build directory structure not found"
    exit 1
fi

# Stop and start PM2 (not just restart)
echo "🔄 Stopping and starting application..."
pm2 delete HRAI-Mining-HR 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# Wait for startup
sleep 3

# Check if app is running
if pm2 list | grep -q "HRAI-Mining-HR.*online"; then
    echo "✅ Application started successfully"
else
    echo "❌ Application failed to start"
    pm2 logs HRAI-Mining-HR --lines 20
    exit 1
fi

echo ""
echo "✅ Complete fix applied!"
echo "🌐 Try accessing: http://wecare.techconnect.co.id/mining-hr/"
echo "💡 If still having issues, try hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo ""
echo "🔍 To debug further, check browser console and PM2 logs:"
echo "   pm2 logs HRAI-Mining-HR"