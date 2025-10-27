# Server Deployment Instructions

## Prerequisites
- Ensure you have Node.js, npm, and PM2 installed on your server
- Make sure your database server (10.182.128.3:1433) is accessible
- Verify NGINX is configured to serve from /mining-hr/ path

## Deployment Steps

### 1. Pull Latest Code
```bash
cd /path/to/your/project
git pull origin main
```

### 2. Set Up Environment Variables
Create a `.env.production` file with your actual API keys and database credentials:
```bash
# Copy the example and edit with real values
cp .env.example .env.production
nano .env.production
```

**IMPORTANT**: Replace the following placeholders with your actual values:
- `your_openai_api_key_here` → Your actual OpenAI API key
- Database connection details for your SQL Server

### 3. Run Automated Deployment
Make the deployment script executable and run it:
```bash
chmod +x deploy-server.sh
./deploy-server.sh
```

The script will automatically:
- Install dependencies
- Build the React application
- Configure PM2 with the ecosystem configuration
- Start/restart the application
- Verify the deployment is healthy

### 4. Verify Deployment
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs mining-hr-backend`
- Test the application: `curl http://localhost:3050/api/health`
- Access via NGINX: Visit your domain/mining-hr/

## Manual Steps (if automated deployment fails)

### Install Dependencies
```bash
npm install
```

### Build React Application
```bash
npm run build
```

### Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Troubleshooting

### If API calls fail:
- Verify `.env.production` has the correct OpenAI API key
- Check that the key has sufficient credits
- Ensure the server can reach api.openai.com

### If database connection fails:
- Verify database server accessibility from your server
- Check SQL Server authentication settings
- Confirm database credentials in `.env.production`

### If application won't start:
- Check PM2 logs: `pm2 logs mining-hr-backend`
- Verify port 3050 is available
- Check file permissions on project directory

## Security Notes
- Never commit `.env.production` to git
- Keep API keys secure and rotate them regularly
- Monitor API usage and costs
- Ensure proper firewall rules are in place

## Support
If you encounter issues during deployment, check:
1. PM2 logs for application errors
2. NGINX logs for proxy issues
3. System logs for server-level problems