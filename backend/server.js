const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const pool = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const passwordResetRoutes = require('./routes/passwordReset');
const studentRoutes = require('./routes/studentsProfile');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com'] // Add your production domain
    : ['http://localhost:8080', 'http://127.0.0.1:8080'], // Development origins
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/students', studentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'frontend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/password-reset', passwordResetRoutes);

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

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // Handle express-validator errors
  if (err.array) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.array()
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Start server
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
    pool.end(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    pool.end(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
