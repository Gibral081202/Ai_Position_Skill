#!/bin/bash
# Test Environment Variables

echo "🧪 Testing Environment Variable Setup..."

# Check if .env.production exists
if [ -f ".env.production" ]; then
    echo "✅ .env.production file exists"
    
    # Source the file
    set -a
    source .env.production
    set +a
    
    # Check if API key is loaded
    if [ ! -z "$REACT_APP_OPENAI_API_KEY" ]; then
        echo "✅ REACT_APP_OPENAI_API_KEY is loaded"
        echo "   Key starts with: ${REACT_APP_OPENAI_API_KEY:0:15}..."
        echo "   Key length: ${#REACT_APP_OPENAI_API_KEY} characters"
    else
        echo "❌ REACT_APP_OPENAI_API_KEY not found"
        echo "Environment variables found:"
        env | grep REACT_APP_ | cut -d'=' -f1
    fi
    
    # Test a simple Node.js check
    echo ""
    echo "🧪 Testing Node.js environment variable access:"
    node -e "
        console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? 'Found (' + process.env.REACT_APP_OPENAI_API_KEY.substring(0,15) + '...)' : 'Not found');
    "
    
else
    echo "❌ .env.production file not found"
fi