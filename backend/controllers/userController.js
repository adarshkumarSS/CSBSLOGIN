const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const userController = {


  // Create new user
  async createUser(req, res) {
    try {
      console.log('Create user request:', req.body); // Debug log
      const { role, name, email, password, ...userData } = req.body;

      if (!role || !name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Role, name, email, and password are required'
        });
      }

      // Check if email already exists
      let existingUser;
      if (role === 'student') {
        existingUser = await pool.query('SELECT id FROM students WHERE email = $1', [email]);
      } else {
        existingUser = await pool.query('SELECT id FROM faculty WHERE email = $1', [email]);
      }

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Email already exists in the ${role} table`
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      let query, values;
      if (role === 'student') {
        query = `
          INSERT INTO students (name, email, password_hash, roll_number, year, department, phone)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name, email, roll_number, year, department, phone, 'student' as role
        `;
        values = [name, email, hashedPassword, userData.rollNumber, userData.year, userData.department, userData.phone];
      } else {
        query = `
          INSERT INTO faculty (name, email, password_hash, employee_id, department, designation, phone)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name, email, employee_id as roll_number, department, designation, phone, 'faculty' as role
        `;
        values = [name, email, hashedPassword, userData.employeeId, userData.department, userData.designation, userData.phone];
      }

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result.rows[0]
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, name, email, ...userData } = req.body;

      let query, values;
      if (role === 'student') {
        query = `
          UPDATE students
          SET name = $1, email = $2, roll_number = $3, year = $4, department = $5, phone = $6, updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
          RETURNING id, name, email, roll_number, year, department, phone, 'student' as role
        `;
        values = [name, email, userData.rollNumber, userData.year, userData.department, userData.phone, id];
      } else {
        query = `
          UPDATE faculty
          SET name = $1, email = $2, employee_id = $3, department = $4, designation = $5, phone = $6, updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
          RETURNING id, name, email, employee_id as roll_number, department, designation, phone, 'faculty' as role
        `;
        values = [name, email, userData.employeeId, userData.department, userData.designation, userData.phone, id];
      }

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: result.rows[0]
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.query;

      let query, tableName;
      if (role === 'student') {
        tableName = 'students';
        query = 'DELETE FROM students WHERE id = $1';
      } else {
        tableName = 'faculty';
        query = 'DELETE FROM faculty WHERE id = $1';
      }

      const result = await pool.query(query, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Search users with filters
  async searchUsers(req, res) {
    try {
      const { search, role, year, department } = req.query;

      let studentsQuery = `
        SELECT id, name, email, roll_number, year, department, phone, 'student' as role
        FROM students WHERE 1=1
      `;
      let facultyQuery = `
        SELECT id, name, email, employee_id, department, designation, phone, 'faculty' as role
        FROM faculty WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Add search filter
      if (search) {
        const searchCondition = ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        studentsQuery += searchCondition;
        facultyQuery += searchCondition;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Add role filter
      if (role === 'student') {
        facultyQuery = null; // Only get students
      } else if (role === 'faculty') {
        studentsQuery = null; // Only get faculty
      }

      // Add year filter (students only)
      if (year && studentsQuery) {
        studentsQuery += ` AND year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
      }

      // Add department filter
      if (department) {
        const deptCondition = ` AND department = $${paramIndex}`;
        if (studentsQuery) studentsQuery += deptCondition;
        if (facultyQuery) facultyQuery += deptCondition;
        params.push(department);
      }

      // Execute queries
      const results = [];

      if (studentsQuery) {
        const studentsResult = await pool.query(studentsQuery, params);
        results.push(...studentsResult.rows);
      }

      if (facultyQuery) {
        const facultyResult = await pool.query(facultyQuery, params);
        results.push(...facultyResult.rows);
      }

      res.json({
        success: true,
        data: results,
        meta: {
          total: results.length,
          search: search || null,
          role: role || null,
          year: year || null,
          department: department || null
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = userController;
