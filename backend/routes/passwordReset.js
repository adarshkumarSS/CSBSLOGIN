const express = require('express');
const { body, validationResult } = require('express-validator');
const passwordResetController = require('../controllers/passwordResetController');

const router = express.Router();

// Validation middleware
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const validateOtp = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  body('userType')
    .isIn(['student', 'faculty'])
    .withMessage('Invalid user type')
];

const validateReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password'),
  body('userType')
    .isIn(['student', 'faculty'])
    .withMessage('Invalid user type')
];

// Error handling middleware for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Routes
router.post('/forgot-password', validateEmail, handleValidationErrors, passwordResetController.forgotPassword);
router.post('/verify-otp', validateOtp, handleValidationErrors, passwordResetController.verifyOtp);
router.post('/reset-password', validateReset, handleValidationErrors, passwordResetController.resetPassword);

module.exports = router;
