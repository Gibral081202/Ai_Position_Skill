# HRAI Server Deployment Guide

## 🚀 Complete Guide for Updating HRAI on Production Server

This guide will help you update the HRAI application on your GCP server with all the recent changes from GitHub.

## 📋 Prerequisites

- Access to GCP server via SSH
- GitHub repository with latest changes
- NGINX configured properly
- PM2 process manager installed

## 🔧 Step-by-Step Deployment Process

### 1. Connect to Server via SSH

```bash
# Connect to GCP server with SSH tunnel for database
gcloud compute ssh gcp-hr-applications --project hris-292403 --zone asia-southeast2-a --ssh-flag="-L 1435:10.182.128.3:1433"
```

### 2. Navigate to Application Directory

```bash
cd /var/www/Ai_Position_Skill
pwd  # Verify you're in the correct directory
```

### 3. Check Current Status

```bash
# Check current PM2 status
pm2 status HRAI-Mining-HR

# Check current git status
git status
git log --oneline -5  # See last 5 commits
```

### 4. Run the Update Script

```bash
# Make the update script executable
chmod +x server-update.sh

# Run the update script
./server-update.sh
```

**OR** follow manual steps below if you prefer:

### 5. Manual Update Process (Alternative)

```bash
# Step 1: Create backup
sudo cp -r /var/www/Ai_Position_Skill /var/backups/ai-position-skill-$(date +%Y%m%d-%H%M%S)

# Step 2: Pull latest changes
git stash  # Stash any local changes
git pull origin main

# Step 3: Install dependencies
npm install

# Step 4: Build application
npm run build

# Step 5: Copy production environment
cp .env.server .env

# Step 6: Restart application
pm2 restart HRAI-Mining-HR

# Step 7: Check status
pm2 status HRAI-Mining-HR
pm2 logs HRAI-Mining-HR --lines 20
```

### 6. Verify Deployment

```bash
# Check if application is responding
curl http://localhost:3050/api/health

# Check NGINX access
curl http://localhost/mining-hr/

# Check PM2 monitoring
pm2 monit
```

### 7. Test Key Features

1. **Access the application**: http://wecare.techconnect.co.id/mining-hr/
2. **Test organizational chart**: Verify levels 1-5 appear
3. **Test position selection**: Click on staff positions
4. **Test assessment generation**: Verify AI assessments work
5. **Check database connection**: Verify data loads properly

## 🔍 Recent Changes Included

The latest deployment includes these important changes:

### ✅ Staff Name Handling Fix
- **Changed**: Now uses `relationship_obj_text` column for staff names
- **Benefit**: Actual person names instead of organization manager titles
- **Impact**: Fixes "PRESIDENT DIRECTOR" appearing as staff names

### ✅ Position Holder Logic Enhancement
- **Changed**: Improved validation for vacant positions
- **Benefit**: Better handling of empty/null staff assignments
- **Impact**: Cleaner display and no incorrect assessments

### ✅ Frontend Validation Improvements
- **Changed**: Enhanced position selection validation
- **Benefit**: Prevents assessments for vacant positions
- **Impact**: Better user experience and data accuracy

### ✅ Database Query Optimization
- **Changed**: Added `relationship_obj_text` to SQL queries
- **Benefit**: Complete data retrieval for staff information
- **Impact**: More accurate organizational chart display

## 🚨 Troubleshooting

### If Build Fails:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If PM2 Won't Start:
```bash
# Kill all PM2 processes and restart
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### If Database Connection Fails:
```bash
# Check if SSH tunnel is active
netstat -tulpn | grep 1435

# Restart SSH tunnel if needed
# (Run this from your local machine)
gcloud compute ssh gcp-hr-applications --project hris-292403 --zone asia-southeast2-a --ssh-flag="-L 1435:10.182.128.3:1433"
```

### If NGINX Issues:
```bash
# Check NGINX configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx

# Check NGINX logs
sudo tail -f /var/log/nginx/error.log
```

## 📊 Monitoring Commands

```bash
# PM2 monitoring
pm2 status              # Show all processes
pm2 logs HRAI-Mining-HR # Show application logs
pm2 monit               # Real-time monitoring
pm2 info HRAI-Mining-HR # Detailed process info

# System monitoring
htop                    # System resources
df -h                   # Disk space
free -h                 # Memory usage
```

## 🔄 Rollback Procedure (If Needed)

If something goes wrong, you can rollback:

```bash
# Stop current application
pm2 stop HRAI-Mining-HR

# Restore from backup
sudo rm -rf /var/www/Ai_Position_Skill
sudo cp -r /var/backups/ai-position-skill-[BACKUP_DATE] /var/www/Ai_Position_Skill
sudo chown -R Gibral:Gibral /var/www/Ai_Position_Skill

# Restart application
cd /var/www/Ai_Position_Skill
pm2 start ecosystem.config.js
```

## 📝 Post-Deployment Checklist

- [ ] Application starts successfully in PM2
- [ ] Health check endpoint responds
- [ ] NGINX serves the application correctly
- [ ] Organizational chart loads and displays levels 1-5
- [ ] Position selection works without errors
- [ ] Staff names display correctly (no "PRESIDENT DIRECTOR" issues)
- [ ] Assessment generation works with Gemini AI
- [ ] Database queries execute successfully
- [ ] No errors in PM2 logs
- [ ] SSH tunnel for database is stable

## 🌐 Access URLs

- **Application**: http://wecare.techconnect.co.id/mining-hr/
- **API Health**: http://localhost:3050/api/health
- **Direct Access**: http://localhost:3050

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs HRAI-Mining-HR`
3. Check system resources: `htop` and `df -h`
4. Verify database connectivity through SSH tunnel
5. Test NGINX configuration: `sudo nginx -t`

The deployment should now include all recent changes and work properly in both local and server environments!