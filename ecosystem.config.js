module.exports = {
  apps: [
    {
      name: 'HRAI-Mining-HR',
      script: 'server.js',
      cwd: '/var/www/Ai_Position_Skill',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3050,
        HOST: '0.0.0.0',
        PUBLIC_URL: '/mining-hr'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3050,
        HOST: '0.0.0.0',
        PUBLIC_URL: '/mining-hr'
      },
      // 🔧 ENHANCED: Performance and stability settings
      max_memory_restart: '4G',  // Increased from 2G to 4G
      node_args: '--max-old-space-size=4096',
      
      // 🔧 ENHANCED: More resilient restart settings
      max_restarts: 10,     // Increased from 5 to 10
      min_uptime: '30s',    // Increased from 10s to 30s for stability
      restart_delay: 5000,  // 5 second delay between restarts
      
      // 🔧 ENHANCED: Better error handling
      exp_backoff_restart_delay: 100,  // Exponential backoff for restarts
      
      // Logging
      log_file: '/var/log/pm2/HRAI-Mining-HR.log',
      out_file: '/var/log/pm2/HRAI-Mining-HR-out.log',
      error_file: '/var/log/pm2/HRAI-Mining-HR-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,     // Merge cluster logs
      
      // Auto restart settings
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', '.git', 'build'],
      
      // 🔧 ENHANCED: Health monitoring (removed problematic health_check_url)
      // health_check_url: 'http://localhost:3050/api/health',
      // health_check_grace_period: 10000,
      
      // Additional production settings
      autorestart: true,
      kill_timeout: 10000,   // Increased from 5000 to 10000 for graceful shutdown
      wait_ready: true,
      listen_timeout: 15000, // Increased from 10000 to 15000
      
      // 🔧 NEW: Additional stability options
      vizion: false,         // Disable git metadata (reduces memory)
      disable_source_map_support: true  // Disable source maps in production
    }
  ]
};