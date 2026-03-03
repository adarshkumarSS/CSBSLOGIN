const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

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
        existingUser = await Student.findOne({ email });
      } else {
        existingUser = await Faculty.findOne({ email });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `Email already exists in the ${role} table`
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      let newUser;
      let savedUser;

      if (role === 'student') {
        newUser = new Student({
          name,
          email,
          password_hash: hashedPassword,
          roll_number: userData.rollNumber,
          year: userData.year,
          department: userData.department,
          phone: userData.phone
        });
        savedUser = await newUser.save();
      } else {
        newUser = new Faculty({
          name,
          email,
          password_hash: hashedPassword,
          employee_id: userData.employeeId,
          department: userData.department,
          designation: userData.designation,
          phone: userData.phone
        });
        savedUser = await newUser.save();
      }

      // Map response to match frontend expectation
      const responseData = savedUser.toObject();
      responseData.id = responseData._id; // Map _id to id
      delete responseData._id;
      delete responseData.password_hash;
      responseData.role = role;

      // Handle specific field mapping if needed (snake_case vs camelCase for response?)
      // Original SQL returned snake_case or whatever naming was in DB, but actually in SQL string it was:
      // RETURNING id, name, email, roll_number, year, department, phone
      // The frontend likely expects these snake_case or camelCase?
      // In JS object from SQL node-pg, it's usually column name.
      // My schema uses snake_case for `roll_number`, `employee_id`. So Mongoose object will have `roll_number`.
      // The original `values` array used `userData.rollNumber`, so input was camelCase.
      // SQL Insert used `roll_number`.
      // So input: camelCase. Output: whatever SQL returned.
      // SQL `RETURNING ... roll_number` -> output object has `roll_number`.
      // Mongoose schema has `roll_number`. So `savedUser` has `roll_number`.
      // Perfect.
        query = `
          INSERT INTO faculty (name, email, password_hash, employee_id, department, designation, phone, years_of_experience, degree, works,educational_qualifications,awards_honours,other_achievements)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id, name, email, employee_id as roll_number, department, designation, phone, years_of_experience, degree, works,educational_qualifications,awards_honours,other_achievements,  'faculty' as role`;
        values = [name, email, hashedPassword, userData.employeeId, userData.department, userData.designation, userData.phone, userData.yearsOfExperience, userData.degree, userData.works];
      }

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: responseData
      });

    } catch (error) {
      console.error('Create user error:', error);
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

      let updatedUser;
      
      if (role === 'student') {
        const updateData = {
          name,
          email,
          roll_number: userData.rollNumber,
          year: userData.year,
          department: userData.department,
          phone: userData.phone,
          updated_at: Date.now()
        };
        
        updatedUser = await Student.findByIdAndUpdate(id, updateData, { new: true });
        if (updatedUser) updatedUser = updatedUser.toObject();
        if (updatedUser) updatedUser.role = 'student';

      } else {
        const updateData = {
          name,
          email,
          employee_id: userData.employeeId,
          department: userData.department,
          designation: userData.designation,
          phone: userData.phone,
          updated_at: Date.now()
        };

        updatedUser = await Faculty.findByIdAndUpdate(id, updateData, { new: true });
        if (updatedUser) updatedUser = updatedUser.toObject();
        if (updatedUser) updatedUser.role = 'faculty';
      }

      if (!updatedUser) {
        query = `
          UPDATE faculty
          SET name = $1, email = $2, employee_id = $3, department = $4, designation = $5, phone = $6, years_of_experience = $7, degree = $8, works = $9, educational_qualifications = $10, awards_honours = $11, other_achievements = $12, updated_at = CURRENT_TIMESTAMP
          WHERE id = $13
          RETURNING id, name, email, employee_id as roll_number, department, designation, phone, years_of_experience, degree, works, educational_qualifications, awards_honours, other_achievements,'faculty' as role
        `;
        values = [name, email, userData.employeeId, userData.department, userData.designation, userData.phone, userData.yearsOfExperience, userData.degree, userData.works, id];
      }

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      updatedUser.id = updatedUser._id;
      delete updatedUser._id;
      delete updatedUser.password_hash;

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update user error:', error);
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

      let result;
      if (role === 'student') {
        result = await Student.findByIdAndDelete(id);
      } else {
        result = await Faculty.findByIdAndDelete(id);
      }

      if (!result) {
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
      console.error('Delete user error:', error);
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
        SELECT id, name, email, employee_id, department, designation, phone, years_of_experience, degree, works, educational_qualifications, awards_honours, other_achievements, 'faculty' as role
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

      // Helper for mapping
      const mapUser = (u, r) => {
        const obj = u.toObject();
        obj.id = obj._id;
        delete obj._id;
        delete obj.password_hash;
        obj.role = r;
        return obj;
      };

      // Search Students
      if (!role || role === 'student') {
        const query = {};
        if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ];
        }
        if (year) query.year = year;
        if (department) query.department = department;

        const students = await Student.find(query);
        results.push(...students.map(s => mapUser(s, 'student')));
      }

      // Search Faculty
      if (!role || role === 'faculty') {
         const query = {};
         if (search) {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ];
        }
        if (department) query.department = department;

        const faculty = await Faculty.find(query);
        results.push(...faculty.map(f => mapUser(f, 'faculty')));
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
      console.error('Search user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = userController;
