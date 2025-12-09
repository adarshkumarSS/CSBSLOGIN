const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/passwordReset');
const meetingRoutes = require('./routes/meetings');
const queryRoutes = require('./routes/queries');
const allocationRoutes = require('./routes/allocation');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com']
    : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8081', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'frontend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    db: 'mongodb'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/allocation', allocationRoutes);

// Static files (for reports)
app.use('/public', express.static(path.join(__dirname, 'public')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err.array) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.array()
    });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Start server ONLY after DB connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Listen
    const server = app.listen(PORT, () => {
      console.log('🚀 ============================================');
      console.log(`🚀 frontend API Server Started`);
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
      console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
      console.log('🚀 ============================================');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
