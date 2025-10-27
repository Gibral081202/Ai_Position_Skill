#!/bin/bash

# HRAI Mining HR Position Qualification Assessment - Production Deployment Script
# For deployment on wecare.techconnect.co.id server

set -e  # Exit on any error

echo "🚀 Starting HRAI Mining HR deployment..."

# Change to project directory
cd /var/www/Ai_Position_Skill

echo "📥 Pulling latest changes from Git..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🔧 Building React app with correct PUBLIC_URL..."
export PUBLIC_URL=/mining-hr/
export REACT_APP_PUBLIC_URL=/mining-hr/
npm run build

echo "📁 Setting proper permissions..."
sudo chown -R www-data:www-data /var/www/Ai_Position_Skill/build/
sudo chmod -R 755 /var/www/Ai_Position_Skill/build/

echo "🔄 Restarting PM2 process..."
pm2 restart HRAI-Mining-HR

echo "📊 Checking PM2 status..."
pm2 list

echo "🧪 Testing server endpoints..."
sleep 5
curl -f http://localhost:3050/api/health || echo "⚠️  API health check failed"

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at: https://wecare.techconnect.co.id/mining-hr/"
echo "📊 Monitor logs with: pm2 logs HRAI-Mining-HR"