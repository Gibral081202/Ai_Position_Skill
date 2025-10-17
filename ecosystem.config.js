module.exports = {
  apps: [{
    name: 'HRAI-Mining-HR',
    script: 'server.js',
    cwd: '/var/www/ai-position-skill',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_file: '/var/www/ai-position-skill/.env',
    env: {
      NODE_ENV: 'production',
      PORT: 3050
    },
    error_file: '/var/log/pm2/HRAI-Mining-HR-error.log',
    out_file: '/var/log/pm2/HRAI-Mining-HR-out.log',
    log_file: '/var/log/pm2/HRAI-Mining-HR-combined.log',
    time: true
  }]
};