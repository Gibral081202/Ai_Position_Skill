#!/bin/bash
# Fix .env.production file syntax

echo "🔧 Fixing .env.production file syntax..."

# Backup the original file
cp .env.production .env.production.backup

# Clean the file by removing problematic lines and fixing syntax
echo "📝 Cleaning environment file..."

# Create a new clean .env.production
cat > .env.production.new << 'EOF'
# Production Environment Configuration
# Database Configuration
DATABASE_URL=mssql+pyodbc://sa:YourPassword@10.182.128.3:1433/organization_chart?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes
DATABASE_HOST=10.182.128.3
DATABASE_PORT=1433
DATABASE_NAME=organization_chart
DATABASE_USER=sa
DATABASE_PASSWORD=YourPassword

# Source Database Configuration (same as main)
SOURCE_DATABASE_URL=mssql+pyodbc://sa:YourPassword@10.182.128.3:1433/organization_chart?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes
SOURCE_DATABASE_HOST=10.182.128.3
SOURCE_DATABASE_PORT=1433
SOURCE_DATABASE_NAME=organization_chart
SOURCE_DATABASE_USER=sa
SOURCE_DATABASE_PASSWORD=YourPassword

# Database Performance Configuration
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600
QUERY_TIMEOUT=60

# Application Configuration
PORT=3050
NODE_ENV=production
PUBLIC_URL=/mining-hr
HOST=0.0.0.0
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true

# File Upload Settings
UPLOAD_FOLDER=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=xlsx,xls,csv

# Application Metadata
REACT_APP_APP_NAME="HRAI - Mining Industry Position Qualification Assessment"
REACT_APP_VERSION=1.0.0
EOF

# Copy the API key from the old file if it exists
if grep -q "REACT_APP_OPENAI_API_KEY" .env.production.backup; then
    API_KEY=$(grep "REACT_APP_OPENAI_API_KEY" .env.production.backup | cut -d'=' -f2)
    echo "REACT_APP_OPENAI_API_KEY=$API_KEY" >> .env.production.new
    echo "✅ API key preserved from original file"
else
    echo "# REACT_APP_OPENAI_API_KEY=your_openai_api_key_here" >> .env.production.new
    echo "⚠️  API key not found in original file - please set it manually"
fi

# Replace the original file
mv .env.production.new .env.production

echo "✅ .env.production file has been cleaned"
echo "📋 Please verify the API key is correct:"
grep "REACT_APP_OPENAI_API_KEY" .env.production

echo ""
echo "🚀 Now run: ./simple-fix.sh"