// server.js - COMPLETE VERSION FOR ALISHAN INVENTORY
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration - Frontend URLs ke saath compatible
const allowedOrigins = [
  'https://alishaninventory.netlify.app',
  'http://localhost',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://alishanapp.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ALISHAN Inventory Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    frontend: 'https://alishaninventory.netlify.app',
    version: '2.0'
  });
});

// ✅ Google Configuration Endpoint - Frontend ko credentials provide karega
app.get('/api/google-config', (req, res) => {
  try {
    console.log('🔧 Google Config requested from:', req.headers.origin);
    
    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_API_KEY) {
      console.error('❌ Missing Google environment variables');
      return res.status(500).json({
        success: false,
        error: 'Google configuration not complete on server'
      });
    }

    const config = {
      success: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      apiKey: process.env.GOOGLE_API_KEY,
      scopes: 'https://www.googleapis.com/auth/drive.file',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('✅ Google config delivered successfully');
    res.json(config);

  } catch (error) {
    console.error('❌ Error in Google config endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while loading Google configuration'
    });
  }
});

// ✅ Backup Management Endpoints
app.post('/api/backup', (req, res) => {
  try {
    const { data, fileName, type } = req.body;
    
    console.log(`📦 Backup request received: ${fileName} (${type})`);
    
    // Yahan aap database mein backup save kar sakte hain
    // For now, we'll just acknowledge the request
    
    res.json({
      success: true,
      message: 'Backup received successfully',
      fileName: fileName,
      timestamp: new Date().toISOString(),
      itemsCount: data ? data.length : 0
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process backup'
    });
  }
});

// ✅ Test Endpoint - Frontend connection verify karne ke liye
app.get('/api/test-frontend', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is properly connected to frontend!',
    frontendUrl: 'https://alishaninventory.netlify.app',
    backendUrl: 'https://alishanapp.onrender.com',
    timestamp: new Date().toISOString()
  });
});

// ✅ Error Handling Middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// ✅ 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: {
      health: '/api/health',
      googleConfig: '/api/google-config',
      test: '/api/test-frontend',
      backup: '/api/backup (POST)'
    }
  });
});

// ✅ Server Startup
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 ALISHAN INVENTORY BACKEND STARTED
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Frontend: https://alishaninventory.netlify.app
📊 Backend URL: https://alishanapp.onrender.com

✅ Available Endpoints:
   • GET  /api/health
   • GET  /api/google-config
   • GET  /api/test-frontend
   • POST /api/backup

🔧 Google Drive Status: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Missing Credentials'}
  `);
});

// ✅ Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔴 Server terminated gracefully...');
  process.exit(0);
});
