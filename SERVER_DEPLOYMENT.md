# HRAI Mining HR Position Qualification Assessment - Server Deployment Guide

## 🎯 Overview
This document describes the deployment configuration for the HRAI Mining HR Position Qualification Assessment system on the production server at `wecare.techconnect.co.id`.

## 🌐 Production URLs
- **Main Application**: https://wecare.techconnect.co.id/mining-hr/
- **API Endpoints**: https://wecare.techconnect.co.id/mining-hr/api/

## 📂 Server Directory Structure
```
/var/www/Ai_Position_Skill/
├── build/                 # React production build (served by NGINX)
├── src/                   # Source code
├── server.js              # Express.js API server
├── ecosystem.config.js    # PM2 configuration
├── .env                   # Production environment variables (copy from .env.server template)
├── deploy.sh              # Deployment script
└── package.json          # Dependencies and scripts
```

## 🔧 NGINX Configuration (Already Configured)
The NGINX configuration handles:
- **Static Files**: Served directly from `/var/www/Ai_Position_Skill/build/`
- **API Requests**: Proxied to `http://127.0.0.1:3050/api/`
- **React Router**: Falls back to `/mining-hr/index.html` for SPA routing

## 🚀 PM2 Process Management
Current running process:
```
PM2 ID: 3
Name: HRAI-Mining-HR  
Port: 3050
Status: online
```

## 📝 Deployment Steps

### Initial Server Setup (Already Done)
1. Clone repository: `git clone https://github.com/Gibral081202/Ai_Position_Skill.git`
2. Install dependencies: `npm install`
3. Copy environment: `cp .env.server .env` (and add actual API keys)
4. Start PM2 process: `pm2 start ecosystem.config.js`

### Regular Deployment Updates

**Option 1: Using deploy script (Recommended)**
```bash
cd /var/www/Ai_Position_Skill
chmod +x deploy.sh
./deploy.sh
```

**Option 2: Manual deployment**
```bash
cd /var/www/Ai_Position_Skill
git pull origin main
npm install

# Load environment variables from .env and build with them
source .env
export PUBLIC_URL=/mining-hr/
export REACT_APP_PUBLIC_URL=/mining-hr/
npm run build

sudo chown -R www-data:www-data build/
pm2 restart HRAI-Mining-HR
```

**⚠️ CRITICAL: Environment Variables for React Build**

The React app must be built with the actual API keys from your `.env` file. The error you saw (`your-ope************here`) means the React build used placeholder values instead of real API keys.

**To fix this issue:**
1. Make sure your `.env` file contains the real `REACT_APP_OPENAI_API_KEY`
2. The React build process must have access to these environment variables
3. Use `source .env` before running `npm run build` to load the environment variables

## 🔍 Monitoring & Troubleshooting

### Check Application Status
```bash
pm2 list                           # View all processes
pm2 logs HRAI-Mining-HR           # View application logs  
pm2 monit                         # Real-time monitoring
curl http://localhost:3050/api/health  # Test API directly
```

### Common Issues

#### 1. Static Files Not Loading
- **Symptom**: Blank white page or missing CSS/JS
- **Cause**: Incorrect PUBLIC_URL during build
- **Fix**: Rebuild with `PUBLIC_URL=/mining-hr/ npm run build`

#### 2. API Calls Failing  
- **Symptom**: Network errors in browser console
- **Cause**: API server not running on port 3050
- **Fix**: `pm2 restart HRAI-Mining-HR`

#### 3. Database Connection Issues
- **Symptom**: 500 errors on API calls
- **Cause**: Database credentials or network connectivity
- **Fix**: Check `.env` file and database server status

## 🔒 Security Notes
- Environment variables contain sensitive API keys and database credentials
- The `.env` file should never be committed to Git
- API endpoints are protected by NGINX proxy configuration

## 📊 Performance Monitoring
- **Memory Usage**: Monitor via `pm2 monit` (current: ~96MB)  
- **CPU Usage**: Should be <5% under normal load
- **Log Files**: Available via `pm2 logs HRAI-Mining-HR`

## 🔄 Backup & Recovery
- **Database**: Handled by SQL Server backup procedures
- **Application Code**: Stored in Git repository  
- **Environment Config**: Manual backup of `.env` file recommended