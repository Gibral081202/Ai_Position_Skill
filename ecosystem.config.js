module.exports = {
  apps: [
    {
      name: 'HRAI-Mining-HR',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3050,
        HOST: '127.0.0.1'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3050,
        HOST: '127.0.0.1'
      },
      // PM2 Configuration
      max_memory_restart: '2G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Performance monitoring
      monitoring: false,
      
      // Environment files
      env_file: '.env.production'
    }
  ]
};