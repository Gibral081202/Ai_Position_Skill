#!/bin/bash

# HRAI Mining HR - Simple Restart Script
# Just restarts the existing PM2 process without deleting it

echo "🔄 HRAI Mining HR - Simple Restart"
echo "================================="

# Show current status
echo "📊 Current Status:"
pm2 show HRAI-Mining-HR

# Pull latest code
echo ""
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

# Build React app
echo ""
echo "🏗️ Building React app..."
npm run build

# Simply restart the existing PM2 process
echo ""
echo "🔄 Restarting HRAI-Mining-HR..."
pm2 restart HRAI-Mining-HR

# Reset restart counter
echo ""
echo "🔄 Resetting restart counter..."
pm2 reset HRAI-Mining-HR

# Wait a moment
echo ""
echo "⏳ Waiting for restart..."
sleep 5

# Quick health check
echo ""
echo "🏥 Health Check:"
if curl -f http://localhost:3050/api/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
else
    echo "⚠️ Health check failed - check logs:"
    pm2 logs HRAI-Mining-HR --lines 5
fi

echo ""
echo "📱 Final Status:"
pm2 show HRAI-Mining-HR

echo ""
echo "✅ Restart completed!"
echo "🌐 Application URL: http://wecare.techconnect.co.id/mining-hr/"