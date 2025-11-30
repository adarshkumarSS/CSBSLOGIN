const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

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
      let tableName = 'students';
      let user = null;

      if (email.includes('@tce.edu') || email.includes('@thiagarajar')) {
        // Check if it's HOD by designation
        const facultyResult = await pool.query('SELECT * FROM faculty WHERE email = $1', [email]);
        if (facultyResult.rows.length > 0 && facultyResult.rows[0].designation === 'HOD') {
          userType = 'hod';
          tableName = 'faculty';
          user = facultyResult.rows[0];
        } else {
          userType = 'faculty';
          tableName = 'faculty';
        }
      }

      // Query the appropriate table
      const query = `SELECT * FROM ${tableName} WHERE email = $1`;
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email does not exist',
          errorType: 'email_not_found'
        });
      }

      user = result.rows[0];

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
          id: user.id,
          email: user.email,
          role: userType,
          name: user.name,
          ...(userType === 'student' && {
            rollNumber: user.roll_number,
            year: user.year,
            department: user.department
          }),
          ...(userType === 'faculty' && {
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
            id: user.id,
            name: user.name,
            email: user.email,
            role: userType,
            ...(userType === 'student' && {
              rollNumber: user.roll_number,
              year: user.year,
              department: user.department,
              phone: user.phone
            }),
            ...(userType === 'faculty' && {
              employeeId: user.employee_id,
              designation: user.designation,
              department: user.department,
              phone: user.phone
            })
          }
        }
      });

    } catch (error) {
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

module.exports = authController;
