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

echo "🔧 Building React app with server environment variables..."

# Check if .env exists, if not create it from .env.production
if [ ! -f .env ]; then
  echo "📋 Creating .env from .env.production template..."
  cp .env.production .env
fi

# Load environment variables for React build
echo "🔑 Loading environment variables from .env for React build..."

# Read the .env file and export REACT_APP_ variables specifically
# This ensures React build gets the actual API keys, not placeholders
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [[ ! "$key" =~ ^#.*$ ]] && [[ -n "$key" ]]; then
    # Remove any quotes from the value
    value=$(echo "$value" | sed 's/^["'"'"']\|["'"'"']$//g')
    export "$key=$value"
    # Only show non-sensitive variables
    if [[ "$key" =~ ^(PUBLIC_URL|NODE_ENV|REACT_APP_PUBLIC_URL|REACT_APP_APP_NAME|REACT_APP_VERSION)$ ]]; then
      echo "  $key=$value"
    elif [[ "$key" =~ ^REACT_APP_.*API_KEY$ ]]; then
      echo "  $key=${value:0:15}...***"
    fi
  fi
done < .env

# Validate that we have the required API key
if [ -z "$REACT_APP_OPENAI_API_KEY" ] || [ "$REACT_APP_OPENAI_API_KEY" = "your-openai-api-key-here" ]; then
  echo "❌ ERROR: REACT_APP_OPENAI_API_KEY is not set or still has placeholder value!"
  echo "Current value: ${REACT_APP_OPENAI_API_KEY:-"(not set)"}"
  echo "Please edit .env file and add your actual OpenAI API key."
  exit 1
fi

# Ensure correct path configuration for server deployment
export PUBLIC_URL=/mining-hr/
export REACT_APP_PUBLIC_URL=/mining-hr/

# Show what we're building with (masked for security)
echo "🔑 Building with API key: sk-proj-${REACT_APP_OPENAI_API_KEY:7:10}...${REACT_APP_OPENAI_API_KEY: -10}"
echo "🌐 Building with PUBLIC_URL: $PUBLIC_URL"

# Build the React application
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