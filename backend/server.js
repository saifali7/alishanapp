const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - YEH LINE ADD KAREN
app.use(cors());

app.use(express.json());

// Google Config API - Yeh API keys frontend ko dega
app.get('/api/google-config', (req, res) => {
  try {
    // Security check - sirf trusted domains se allow karein
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000', 
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://yourusername.github.io',
      'https://alishaninventory.netlify.app',  // ✅ APNA NETLIFY URL YAHAN DALE           // ✅ SARE NETLIFY SITES
    ];
    
    const origin = req.headers.origin;
    
    // Allow karein agar origin allowedOrigins mein hai
    if (origin) {
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          // Wildcard match for netlify
          return origin.includes('netlify.app');
        }
        return origin === allowedOrigin;
      });
      
      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }
    
    // API keys environment variables se le rahe hain
    const config = {
      success: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      apiKey: process.env.GOOGLE_API_KEY,
      scopes: 'https://www.googleapis.com/auth/drive.file',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      timestamp: new Date().toISOString()
    };
    
    console.log('Google config requested from:', req.headers.origin);
    res.json(config);
    
  } catch (error) {
    console.error('Error in config API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ALISHAN Backend',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ALISHAN Inventory Backend is running!',
    endpoints: {
      config: '/api/google-config',
      health: '/api/health'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ALISHAN Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
});
