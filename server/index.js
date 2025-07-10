const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/caseRoutes');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true // Enable cookies for CORS
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', authRoutes);
app.use('/api', caseRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    res.json({ 
      status: 'OK', 
      database: dbStatus ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files. Maximum is 5 files per upload.' });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

async function start() {
  try {
    // Test PostgreSQL connection
    console.log('Testing PostgreSQL connection...');
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to PostgreSQL database');
      console.error('Please ensure PostgreSQL is running and configuration is correct');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔗 Auth endpoints:`);
      console.log(`   - POST /api/signup - Create new user`);
      console.log(`   - POST /api/signin - Sign in user`);
      console.log(`   - POST /api/refresh-token - Refresh access token`);
      console.log(`   - POST /api/forgot-password - Request password reset`);
      console.log(`   - POST /api/reset-password - Reset password with token`);
      console.log(`   - GET  /api/user - Get current user (protected)`);
      console.log(`   - PUT  /api/profile - Update user profile (protected)`);
      console.log(`   - POST /api/change-password - Change password (protected)`);
      console.log(`   - POST /api/logout - Logout user`);
      console.log(`🔗 Case endpoints:`);
      console.log(`   - GET    /api/cases - Get user's cases`);
      console.log(`   - GET    /api/cases/:id - Get specific case`);
      console.log(`   - POST   /api/cases - Create new case`);
      console.log(`   - PUT    /api/cases/:id - Update case`);
      console.log(`   - DELETE /api/cases/:id - Delete case`);
      console.log(`   - POST   /api/cases/:caseId/attachments - Upload files`);
      console.log(`   - GET    /api/cases/:caseId/attachments/:attachmentId/download - Download file`);
      console.log(`🔗 Other endpoints:`);
      console.log(`   - GET    /api/health - Health check`);
      
      // Set up periodic cleanup of expired password reset tokens (every hour)
      setInterval(async () => {
        try {
          const authService = require('./src/services/authService');
          await authService.cleanupExpiredPasswordResetTokens();
        } catch (error) {
          console.error('Failed to cleanup expired password reset tokens:', error);
        }
      }, 60 * 60 * 1000); // Run every hour
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start(); 