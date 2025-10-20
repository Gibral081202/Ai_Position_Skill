#!/bin/bash
# Fix Database Connection Script
# This script updates the server with the database connection fix

echo "🔧 Fixing database connection configuration..."
echo "📁 Current directory: $(pwd)"

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull from GitHub"
    exit 1
fi

# Show the database configuration fix
echo "🔍 Database configuration updated:"
echo "   - Changed default server from 127.0.0.1 to 10.182.128.3"
echo "   - Changed default port from 1435 to 1433"
echo "   - Added fallback .env loading"

# Restart the PM2 application
echo "🔄 Restarting HRAI-Mining-HR application..."
pm2 restart HRAI-Mining-HR

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart PM2 application"
    exit 1
fi

# Wait a moment for the application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Test the database connection
echo "🧪 Testing database connection..."
curl -s http://localhost:3050/api/health

echo ""
echo "🧪 Testing filtered hierarchy endpoint..."
curl -s http://localhost:3050/api/flowchart/filtered-hierarchy | head -200

echo ""
echo "✅ Database connection fix deployed!"
echo "📊 Check PM2 logs with: pm2 logs HRAI-Mining-HR --lines 20"