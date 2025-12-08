const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

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
      user = await Student.findById(decoded.id).select('-password_hash');
    } else if (decoded.role === 'faculty' || decoded.role === 'hod') {
      user = await Faculty.findById(decoded.id).select('-password_hash');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user data to request
    // Mongoose documents are objects, but if we need plain object:
    req.user = user.toObject ? user.toObject() : user;
    
    // Ensure role is preserved/correct (logic from original: if hod, keeping role)
    if (decoded.role === 'hod' && req.user.role === 'faculty') {
        // Just for consistency if token said hod but DB says faculty (which is underlying schema)
        // Original logic: user.role = decoded.role
        req.user.role = decoded.role;
    }

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
