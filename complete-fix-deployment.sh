#!/bin/bash
# Complete Fix and Deployment Script
# This script fixes both database connection and NGINX configuration issues

echo "🚀 HRAI Mining HR - Complete Fix Deployment"
echo "=============================================="
echo "📁 Working directory: $(pwd)"
echo "⏰ Timestamp: $(date)"
echo ""

# Step 1: Pull latest code changes
echo "📥 Step 1: Pulling latest changes from GitHub..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull from GitHub"
    exit 1
fi
echo "✅ Code updated successfully"
echo ""

# Step 2: Fix database connection
echo "🔧 Step 2: Fixing database connection..."
pm2 restart HRAI-Mining-HR
echo "⏳ Waiting for application to start..."
sleep 5

# Test database connection
echo "🧪 Testing database connection..."
DB_TEST=$(curl -s http://localhost:3050/api/health)
echo "Health check result: $DB_TEST"

API_TEST=$(curl -s http://localhost:3050/api/flowchart/filtered-hierarchy | head -100)
if [[ $API_TEST == *"success"* ]]; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection still failing:"
    echo "$API_TEST"
fi
echo ""

# Step 3: Check and fix NGINX configuration
echo "🌐 Step 3: Checking NGINX configuration..."

# Check if API proxy exists
if grep -q "location ~ \^/mining-hr/api/" /etc/nginx/sites-available/default; then
    echo "✅ NGINX API proxy configuration exists"
else
    echo "⚠️  NGINX API proxy configuration missing!"
    echo "📋 Required configuration (add this to /etc/nginx/sites-available/default):"
    echo "----------------------------------------------------------------------"
    cat nginx-complete-config.conf
    echo "----------------------------------------------------------------------"
    echo ""
    echo "🔧 Manual steps to fix NGINX:"
    echo "1. sudo nano /etc/nginx/sites-available/default"
    echo "2. Add the above configuration to the server block"
    echo "3. sudo nginx -t"
    echo "4. sudo systemctl reload nginx"
    echo ""
fi

# Test NGINX configuration
echo "🧪 Testing NGINX configuration syntax..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration syntax is valid"
else
    echo "❌ NGINX configuration has syntax errors"
fi
echo ""

# Step 4: Test the complete application
echo "🎯 Step 4: Testing complete application..."
echo "PM2 Status:"
pm2 list

echo ""
echo "🌐 Testing through NGINX proxy..."
echo "Frontend access test:"
curl -s -I "http://localhost/mining-hr/" | head -5

echo ""
echo "API access test:"
curl -s -I "http://localhost/mining-hr/api/health" | head -5

echo ""
echo "📊 Application Logs (last 10 lines):"
pm2 logs HRAI-Mining-HR --lines 10 --nostream

echo ""
echo "✅ Deployment script completed!"
echo "🌐 Access your application at: https://wecare.techconnect.co.id/mining-hr/"
echo "📋 If 404 errors persist, manually update NGINX configuration using nginx-complete-config.conf"