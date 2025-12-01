const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const pool = require('../config/database');

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

      // Determine table name
      const tableName = userType === 'student' ? 'students' : 'faculty';

      // Check if user exists
      const userResult = await pool.query(
        `SELECT id, email, name FROM ${tableName} WHERE email = $1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in our system'
        });
      }

      const user = userResult.rows[0];

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
        await pool.query(
          `INSERT INTO password_reset_otps (user_id, user_type, email, otp, expires_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, userType, email, otp, expiresAt]
        );
      } catch (dbErr) {
        console.error('DB error inserting OTP:', dbErr && dbErr.stack ? dbErr.stack : dbErr);
        return res.status(500).json({
          success: false,
          message: 'Database error while creating OTP',
          error: dbErr.message || String(dbErr)
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
      console.error('Forgot password error:', error && error.stack ? error.stack : error);
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
      const otpResult = await pool.query(
        `SELECT * FROM password_reset_otps 
         WHERE email = $1 AND otp = $2 AND user_type = $3 AND is_used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, otp, userType]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      const otpRecord = otpResult.rows[0];

      // Mark OTP as used
      await pool.query(
        `UPDATE password_reset_otps SET is_used = TRUE WHERE id = $1`,
        [otpRecord.id]
      );

      // Generate a temporary reset token (valid for 15 minutes)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 15 * 60000);

      // Store reset token in database
      await pool.query(
        `INSERT INTO password_reset_otps (user_id, user_type, email, otp, expires_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [otpRecord.user_id, userType, email, resetToken, resetTokenExpiry]
      );

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
      console.error('Verify OTP error:', error && error.stack ? error.stack : error);
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
      const tokenResult = await pool.query(
        `SELECT * FROM password_reset_otps 
         WHERE email = $1 AND otp = $2 AND user_type = $3 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, resetToken, userType]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      const resetRecord = tokenResult.rows[0];

      // Determine table name
      const tableName = userType === 'student' ? 'students' : 'faculty';

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in database
      const updateResult = await pool.query(
        `UPDATE ${tableName} SET password_hash = $1 WHERE id = $2 RETURNING id, email, name`,
        [hashedPassword, resetRecord.user_id]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Mark reset token as used
      await pool.query(
        `UPDATE password_reset_otps SET is_used = TRUE WHERE id = $1`,
        [resetRecord.id]
      );

      const user = updateResult.rows[0];

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
      console.error('Reset password error:', error && error.stack ? error.stack : error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password. Please try again.',
        error: error.message || String(error)
      });
    }
  }
};

module.exports = passwordResetController;
