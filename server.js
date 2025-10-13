const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HRAI - Mining Industry HR Position Qualification Assessment System',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Use PORT environment variable or default to 3050
const port = process.env.PORT || 3050;

app.listen(port, () => {
  console.log(`🚀 HRAI server is running on port ${port}`);
  console.log(`🌐 Access the application at: http://localhost:${port}`);
  console.log(`⛏️  Mining Industry HR Position Qualification Assessment System`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});