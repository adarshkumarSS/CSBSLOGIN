const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const authController = {
  // Login for both students and faculty
  async login(req, res) {
    try {
      const { email, password, expectedRole } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Validate that email domain matches expected role (additional security check)
      if (expectedRole) {
        const isFacultyEmail = email.includes('@tce.edu') || email.includes('@thiagarajar');
        const isStudentEmail = !isFacultyEmail;

        if (expectedRole === 'student' && isFacultyEmail) {
          return res.status(400).json({
            success: false,
            message: 'Faculty email cannot be used for student login. Please use faculty login.',
            errorType: 'role_mismatch'
          });
        }

        if (expectedRole === 'faculty' && isStudentEmail) {
          return res.status(400).json({
            success: false,
            message: 'Student email cannot be used for faculty login. Please use student login.',
            errorType: 'role_mismatch'
          });
        }
      }

      // Determine user type based on email domain
      let userType = 'student';
      let user = null;

      if (email.includes('@tce.edu') || email.includes('@thiagarajar')) {
        // Try to find in Faculty collection
        const faculty = await Faculty.findOne({ email });
        
        if (faculty) {
           userType = 'faculty';
           user = faculty;
           if (faculty.designation === 'HOD') {
             userType = 'hod';
           }
        }
      } else {
        // Try to find in Student collection
        user = await Student.findOne({ email });
      }

      // If not found in the deduced collection, or if userType set but not found
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email does not exist',
          errorType: 'email_not_found'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password',
          errorType: 'invalid_password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id, // Use _id for MongoDB
          email: user.email,
          role: userType,
          name: user.name,
          ...(userType === 'student' && {
            rollNumber: user.roll_number,
            year: user.year,
            department: user.department
          }),
          ...(userType === 'faculty' && { // Covers faculty and hod
            employeeId: user.employee_id,
            designation: user.designation,
            department: user.department
          })
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      // Return user data and token
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id, // Mapping _id to id for frontend compatibility
            name: user.name,
            email: user.email,
            role: userType,
            ...(userType === 'student' && {
              rollNumber: user.roll_number,
              year: user.year,
              department: user.department,
              phone: user.phone
            }),
            ...((userType === 'faculty' || userType === 'hod') && {
              employeeId: user.employee_id,
              designation: user.designation,
              department: user.department,
              phone: user.phone
            })
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      // User data is attached by auth middleware
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
       console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Logout (client-side token removal)
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
};

// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Forgot Password
authController.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let user = await Student.findOne({ email });
    let userType = 'student';

    if (!user) {
      user = await Faculty.findOne({ email });
      userType = 'faculty';
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otp = generateOTP();
    user.reset_password_otp = otp;
    user.reset_password_expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send Email
    const { sendEmail, templates } = require('../utils/emailService');
    const sent = await sendEmail(email, 'Password Reset Code', templates.verification(otp));

    if (sent) {
      res.json({ success: true, message: 'Verification code sent to email' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Verify OTP
authController.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and Code are required' });

    let user = await Student.findOne({ email });
    if (!user) user = await Faculty.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.reset_password_otp !== otp || user.reset_password_expires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    res.json({ success: true, message: 'Code verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Reset Password
authController.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields are required' });

    let user = await Student.findOne({ email });
    if (!user) user = await Faculty.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.reset_password_otp !== otp || user.reset_password_expires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    
    // Clear OTP
    user.reset_password_otp = undefined;
    user.reset_password_expires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = authController;
