# HRAI - Server Deployment Guide

## 🎯 Overview
This guide explains how to deploy the HRAI (Mining Industry Position Qualification Assessment) application to your GCP server at `/var/www/` and make it accessible via NGINX on port 3050.

## 🔧 Prerequisites

### Server Requirements
- **OS**: Ubuntu/Debian Linux
- **Node.js**: Version 18+ 
- **Memory**: 2GB+ RAM recommended
- **Storage**: 1GB+ free space
- **User**: `Gibral` with sudo privileges

### Required Software
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git (if not already installed)
sudo apt-get install -y git
```

## 🚀 Deployment Steps

### Method 1: Automated Deployment (Recommended)

1. **Clone the repository:**
```bash
cd /var/www/
sudo git clone https://github.com/Gibral081202/Ai_Position_Skill.git
sudo chown -R Gibral:Gibral Ai_Position_Skill
cd Ai_Position_Skill
```

2. **Run the deployment script:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Method 2: Manual Deployment

1. **Clone and setup:**
```bash
cd /var/www/
sudo git clone https://github.com/Gibral081202/Ai_Position_Skill.git
sudo chown -R Gibral:Gibral Ai_Position_Skill
cd Ai_Position_Skill
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the application:**
```bash
npm run build
```

4. **Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 NGINX Configuration

Add this configuration to your NGINX server block:

```nginx
# Mining Industry HR Position Qualification Assessment
location /mining-hr/ {
    rewrite ^/mining-hr(/.*)$ $1 break;
    proxy_pass http://localhost:3050;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
    proxy_redirect off;
    proxy_buffering off;
    client_max_body_size 100M;
}

# Handle root /mining-hr redirect
location = /mining-hr {
    return 301 /mining-hr/;
}
```

**Apply NGINX changes:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Verification

### 1. Check Application Health
```bash
curl http://localhost:3050/api/health
```

### 2. Check PM2 Status
```bash
pm2 status HRAI-Mining-HR
pm2 logs HRAI-Mining-HR
```

### 3. Test NGINX Proxy
```bash
curl http://wecare.techconnect.co.id/mining-hr/
```

## 📊 Application Management

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs HRAI-Mining-HR

# Restart application
pm2 restart HRAI-Mining-HR

# Stop application
pm2 stop HRAI-Mining-HR

# Monitor in real-time
pm2 monit
```

### Application Updates
```bash
cd /var/www/Ai_Position_Skill
git pull origin main
npm install
npm run build
pm2 restart HRAI-Mining-HR
```

## 🔐 Environment Variables

The application uses these environment variables (set in `.env.production`):

```bash
REACT_APP_GEMINI_API_KEY=AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4
PORT=3050
NODE_ENV=production
HOST=0.0.0.0
```

## 📍 Access URLs

- **Direct Access**: `http://localhost:3050`
- **Via NGINX**: `http://wecare.techconnect.co.id/mining-hr/`
- **Health Check**: `http://localhost:3050/api/health`

## 🛠 Troubleshooting

### Common Issues

1. **Port already in use:**
```bash
sudo lsof -i :3050
sudo kill -9 <PID>
```

2. **Permission issues:**
```bash
sudo chown -R Gibral:Gibral /var/www/Ai_Position_Skill
```

3. **NGINX not forwarding:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl reload nginx
```

4. **Application not starting:**
```bash
pm2 logs HRAI-Mining-HR --lines 50
```

### Log Locations
- **PM2 Logs**: `/var/log/pm2/HRAI-Mining-HR-*.log`
- **NGINX Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

## 🚨 Important Notes

1. **API Key Security**: The Gemini API key is included for development. For production, consider using environment variables.

2. **Firewall**: Ensure port 3050 is accessible internally (should be fine since NGINX proxies it).

3. **SSL**: The application will work with your existing SSL setup through NGINX.

4. **Updates**: The application will automatically restart on server reboot thanks to PM2 startup script.

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs HRAI-Mining-HR`
2. Check NGINX logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify the health endpoint: `curl http://localhost:3050/api/health`