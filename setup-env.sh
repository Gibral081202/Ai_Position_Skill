#!/bin/bash

# Environment Variables Setup for HRAI Application
# Run this script to set up production environment variables

echo "🔧 Setting up environment variables for HRAI application..."

# Create environment file for PM2
cat > /var/www/ai-position-skill/.env << EOF
NODE_ENV=production
PORT=3050
REACT_APP_GEMINI_API_KEY=AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4
EOF

# Set permissions
chmod 600 /var/www/ai-position-skill/.env
chown Gibral:Gibral /var/www/ai-position-skill/.env

echo "✅ Environment variables configured in /var/www/ai-position-skill/.env"
echo "⚠️  SECURITY NOTICE: Change the Gemini API key in production!"
echo ""
echo "To use a custom API key, run:"
echo "  sudo nano /var/www/ai-position-skill/.env"
echo "  # Then restart the application with: pm2 restart HRAI-Mining-HR"