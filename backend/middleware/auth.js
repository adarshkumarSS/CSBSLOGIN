const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data from database
    let user = null;
    if (decoded.role === 'student') {
      const result = await pool.query('SELECT id, name, email, roll_number, year, department, phone FROM students WHERE id = $1', [decoded.id]);
      if (result.rows.length > 0) {
        user = {
          ...result.rows[0],
          role: 'student'
        };
      }
    } else if (decoded.role === 'faculty' || decoded.role === 'hod') {
      const result = await pool.query('SELECT id, name, email, employee_id, department, designation, phone FROM faculty WHERE id = $1', [decoded.id]);
      if (result.rows.length > 0) {
        user = {
          ...result.rows[0],
          role: decoded.role // Keep the original role (faculty or hod)
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user data to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user has required role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware specifically for HOD role
const requireHod = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'hod') {
    return res.status(403).json({
      success: false,
      message: 'HOD access required'
    });
  }

  next();
};

module.exports = {
  verifyToken: authenticateToken,
  requireRole,
  requireHod
};
