const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
// models
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const PasswordResetOTP = require('../models/PasswordResetOTP');

// Configure email transporter (update these with your email service credentials)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const OTP_EXPIRY_MINUTES = 10; // OTP valid for 10 minutes

const passwordResetController = {
  // Send OTP to email for forgot password
  async forgotPassword(req, res) {
    try {
      const { email, userType } = req.body;

      if (!email || !userType) {
        return res.status(400).json({
          success: false,
          message: 'Email and user type are required'
        });
      }

      if (!['student', 'faculty'].includes(userType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
      }

      // Check if user exists
      let user;
      if (userType === 'student') {
        user = await Student.findOne({ email });
      } else {
        user = await Faculty.findOne({ email });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in our system'
        });
      }

      // Generate OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

      // Store OTP in database
      try {
        await PasswordResetOTP.create({
          user_id: user._id,
          user_type: userType,
          email: email,
          otp: otp,
          expires_at: expiresAt
        });
      } catch (dbErr) {
        console.error('DB error inserting OTP:', dbErr);
        return res.status(500).json({
          success: false,
          message: 'Database error while creating OTP',
          error: dbErr.message
        });
      }

      // Send OTP via email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - Thiagarajar College of Engineering',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #666; font-size: 14px;">Hi ${user.name},</p>
              <p style="color: #666; font-size: 14px;">
                We received a request to reset your password. Your OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.
              </p>
              <div style="background-color: #fff; padding: 20px; border: 2px solid #007bff; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #999;">Your OTP:</p>
                <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                <strong>Important:</strong> Do not share this OTP with anyone. It is valid for ${OTP_EXPIRY_MINUTES} minutes only.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If you didn't request this, please ignore this email or contact support.
              </p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2024 Thiagarajar College of Engineering. All rights reserved.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: 'OTP sent to your email',
        data: {
          email: email,
          message: `OTP has been sent to ${email}`
        }
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.',
        error: error.message || String(error)
      });
    }
  },

  // Verify OTP
  async verifyOtp(req, res) {
    try {
      const { email, otp, userType } = req.body;

      if (!email || !otp || !userType) {
        return res.status(400).json({
          success: false,
          message: 'Email, OTP, and user type are required'
        });
      }

      // Check if OTP exists and is valid
      // Mongoose: find latest valid OTP
      const otpRecord = await PasswordResetOTP.findOne({
        email: email,
        otp: otp,
        user_type: userType,
        is_used: false,
        expires_at: { $gt: new Date() }
      }).sort({ created_at: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Mark OTP as used
      otpRecord.is_used = true;
      await otpRecord.save();

      // Generate a temporary reset token (valid for 15 minutes)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 15 * 60000);

      // Store reset token in database
      await PasswordResetOTP.create({
        user_id: otpRecord.user_id,
        user_type: userType,
        email: email,
        otp: resetToken, // Storing reset token as 'otp' field
        expires_at: resetTokenExpiry
      });

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          resetToken: resetToken,
          email: email,
          userType: userType
        }
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.',
        error: error.message || String(error)
      });
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { email, resetToken, newPassword, confirmPassword, userType } = req.body;

      if (!email || !resetToken || !newPassword || !confirmPassword || !userType) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Verify reset token is valid
      const resetRecord = await PasswordResetOTP.findOne({
        email: email,
        otp: resetToken,
        user_type: userType,
        expires_at: { $gt: new Date() },
        is_used: false // Reset token is a new record, initially unused
      }).sort({ created_at: -1 });

      if (!resetRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      let user;
      if (userType === 'student') {
        user = await Student.findByIdAndUpdate(
          resetRecord.user_id,
          { password_hash: hashedPassword },
          { new: true }
        );
      } else {
        user = await Faculty.findByIdAndUpdate(
          resetRecord.user_id,
          { password_hash: hashedPassword },
          { new: true }
        );
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Mark reset token as used
      resetRecord.is_used = true;
      await resetRecord.save();

      // Send confirmation email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Changed Successfully - Thiagarajar College of Engineering',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #28a745; margin-top: 0;">Password Changed Successfully</h2>
              <p style="color: #666; font-size: 14px;">Hi ${user.name},</p>
              <p style="color: #666; font-size: 14px;">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="color: #155724; margin: 0; font-size: 14px;">
                  ✓ Your account is now secure with your new password.
                </p>
              </div>
              <p style="color: #666; font-size: 14px;">
                <strong>Important:</strong> If you didn't make this change, please contact support immediately.
              </p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2024 Thiagarajar College of Engineering. All rights reserved.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        message: 'Password reset successfully',
        data: {
          email: email,
          message: 'Your password has been reset. You can now log in with your new password.'
        }
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password. Please try again.',
        error: error.message || String(error)
      });
    }
  }
};

module.exports = passwordResetController;
