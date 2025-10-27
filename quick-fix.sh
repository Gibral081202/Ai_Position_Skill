#!/bin/bash
# Quick Server Fix Script - Run this on your server

echo "🔧 Fixing OpenAI API Key Build Issue..."

# Go to the project directory
cd /var/www/Ai_Position_Skill

# Pull the latest fixes
git pull origin main

# Make sure the environment file has the API key
echo "📋 Checking .env.production file..."
if grep -q "REACT_APP_OPENAI_API_KEY=" .env.production; then
    echo "✅ API key found in .env.production"
else
    echo "❌ API key not found in .env.production"
    echo "Please add: REACT_APP_OPENAI_API_KEY=your_actual_api_key_here"
    exit 1
fi

# Load environment variables and rebuild
echo "🏗️ Rebuilding with environment variables..."
export $(grep -v '^#' .env.production | xargs)
NODE_ENV=production npm run build

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart HRAI-Mining-HR

echo "✅ Fix completed! Check your application now."