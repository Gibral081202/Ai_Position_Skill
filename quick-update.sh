#!/bin/bash

# HRAI Quick Update Commands
# Use these commands for fast deployment updates

echo "🚀 HRAI Quick Update - Choose an option:"
echo ""
echo "1. Full Update (Recommended)"
echo "2. Quick Restart Only"
echo "3. Build and Restart"
echo "4. Check Status"
echo "5. View Logs"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
  1)
    echo "🔄 Running full update..."
    ./server-update.sh
    ;;
  2)
    echo "🔄 Quick restart..."
    pm2 restart HRAI-Mining-HR
    pm2 status HRAI-Mining-HR
    ;;
  3)
    echo "🔨 Build and restart..."
    npm run build && pm2 restart HRAI-Mining-HR
    pm2 status HRAI-Mining-HR
    ;;
  4)
    echo "📊 Checking status..."
    pm2 status HRAI-Mining-HR
    echo ""
    echo "Health check:"
    curl -s http://localhost:3050/api/health && echo "✅ API is healthy" || echo "❌ API is not responding"
    ;;
  5)
    echo "📋 Recent logs:"
    pm2 logs HRAI-Mining-HR --lines 20
    ;;
  *)
    echo "❌ Invalid choice"
    ;;
esac