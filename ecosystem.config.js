module.exports = {
  apps: [{
    name: 'HRAI-Mining-HR',
    script: 'server.js',
    cwd: '/home/Gibral/Ai_Position_Skill',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3050,
      REACT_APP_GEMINI_API_KEY: 'AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4'
    },
    error_file: '/var/log/pm2/HRAI-Mining-HR-error.log',
    out_file: '/var/log/pm2/HRAI-Mining-HR-out.log',
    log_file: '/var/log/pm2/HRAI-Mining-HR-combined.log',
    time: true
  }]
};