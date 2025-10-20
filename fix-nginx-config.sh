#!/bin/bash
# NGINX Configuration Fix Script
# This script updates NGINX configuration to properly proxy API requests

echo "🌐 Fixing NGINX configuration for API proxy..."
echo "📁 Current directory: $(pwd)"

# Backup current NGINX configuration
echo "💾 Creating backup of current NGINX configuration..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

if [ $? -ne 0 ]; then
    echo "❌ Failed to backup NGINX configuration"
    exit 1
fi

# Check if our mining-hr configuration already exists
echo "🔍 Checking current NGINX configuration..."
if grep -q "location ~ \^/mining-hr/api/" /etc/nginx/sites-available/default; then
    echo "✅ API proxy configuration already exists"
else
    echo "⚠️  API proxy configuration missing - needs to be added"
fi

# Show the configuration that needs to be added
echo "📋 Configuration needed:"
echo "--------------------------------------"
cat nginx-complete-config.conf
echo "--------------------------------------"

# Test current NGINX configuration
echo "🧪 Testing current NGINX configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Current NGINX configuration is valid"
else
    echo "❌ Current NGINX configuration has errors"
fi

echo ""
echo "🔧 Manual steps needed:"
echo "1. Edit /etc/nginx/sites-available/default"
echo "2. Add the API proxy configuration from nginx-complete-config.conf"
echo "3. Test with: sudo nginx -t"
echo "4. Reload with: sudo systemctl reload nginx"
echo ""
echo "📄 The configuration is available in: nginx-complete-config.conf"

# Test the application endpoints
echo "🧪 Testing application endpoints..."
echo "Health check:"
curl -s http://localhost:3050/api/health | head -100
echo ""
echo "API endpoint:"
curl -s http://localhost:3050/api/flowchart/filtered-hierarchy | head -200