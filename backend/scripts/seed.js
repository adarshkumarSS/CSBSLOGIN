const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const PasswordResetOTP = require('../models/PasswordResetOTP');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    }

    // Sample student data
    const students = [
      {
        name: 'Arun Kumar',
        email: 'arun.kumar@student.tce.edu',
        password: 'student123',
        roll_number: 'CS001',
        year: 'III',
        department: 'Computer Science and Business Systems',
        phone: '+91 9876543210'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@student.tce.edu',
        password: 'student123',
        roll_number: 'CS002',
        year: 'II',
        department: 'Computer Science and Business Systems',
        phone: '+91 9876543211'
      },
      {
        name: 'Rahul Singh',
        email: 'rahul.singh@student.tce.edu',
        password: 'student123',
        roll_number: 'ME001',
        year: 'IV',
        department: 'Computer Science and Business Systems',
        phone: '+91 9876543212'
      },
      {
        name: 'Sneha Patel',
        email: 'sneha.patel@student.tce.edu',
        password: 'student123',
        roll_number: 'EE001',
        year: 'I',
        department: 'Computer Science and Business Systems',
        phone: '+91 9876543213'
      },
      {
        name: 'Vikram Rao',
        email: 'vikram.rao@student.tce.edu',
        password: 'student123',
        roll_number: 'CE001',
        year: 'III',
        department: 'Computer Science and Business Systems',
        phone: '+91 9876543214'
      }
    ];

    // Sample faculty data
    const faculty = [
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@tce.edu',
        password: 'faculty123',
        employee_id: 'FAC001',
        department: 'Computer Science and Business Systems',
        designation: 'Professor',
        phone: '+91 9876543220'
      },
      {
        name: 'Dr. Meera Iyer',
        email: 'meera.iyer@tce.edu',
        password: 'faculty123',
        employee_id: 'FAC002',
        department: 'Computer Science and Business Systems',
        designation: 'Associate Professor',
        phone: '+91 9876543221'
      },
      {
        name: 'Prof. Suresh Reddy',
        email: 'suresh.reddy@tce.edu',
        password: 'faculty123',
        employee_id: 'FAC003',
        department: 'Computer Science and Business Systems',
        designation: 'Assistant Professor',
        phone: '+91 9876543222'
      },
      {
        name: 'Dr. Anitha Venkatesh',
        email: 'anitha.venkatesh@tce.edu',
        password: 'faculty123',
        employee_id: 'FAC004',
        department: 'Computer Science and Business Systems',
        designation: 'Professor',
        phone: '+91 9876543223'
      },
      {
        name: 'Prof. Ramesh Gupta',
        email: 'ramesh.gupta@tce.edu',
        password: 'faculty123',
        employee_id: 'FAC005',
        department: 'Computer Science and Business Systems',
        designation: 'Associate Professor',
        phone: '+91 9876543224'
      },
      {
        name: 'Dr. Saravanan HOD',
        email: 'saravanan.hod@tce.edu',
        password: 'hod123',
        employee_id: 'HOD001',
        department: 'Computer Science and Business Systems',
        designation: 'HOD',
        phone: '+91 9876543225'
      }
    ];

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await PasswordResetOTP.deleteMany({});

    // Insert students
    // Insert faculty FIRST so we can assign them as tutors
    console.log('👨‍🏫 Seeding faculty...');
    const createdFaculty = [];
    for (const member of faculty) {
      const hashedPassword = await bcrypt.hash(member.password, 12);
      const newFaculty = await Faculty.create({
          name: member.name,
          email: member.email,
          password_hash: hashedPassword,
          employee_id: member.employee_id,
          department: member.department,
          designation: member.designation,
          phone: member.phone
      });
      createdFaculty.push(newFaculty);
    }

    // Assign a default tutor (e.g., first faculty member)
    const defaultTutor = createdFaculty[0];

    // Insert students
    console.log('👨‍🎓 Seeding students...');
    for (const student of students) {
      const hashedPassword = await bcrypt.hash(student.password, 12);
      await Student.create({
          name: student.name,
          email: student.email,
          password_hash: hashedPassword,
          roll_number: student.roll_number,
          year: student.year, // Keep for backward compat if needed, but we rely on semester
          semester: 5, // Default for testing
          section: 'A', // Default
          degree: 'B.Tech', // Default
          department: student.department,
          phone: student.phone,
          tutor_id: defaultTutor._id
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('\n👨‍🎓 STUDENTS:');
    students.forEach(student => {
      console.log(`  Email: ${student.email}`);
      console.log(`  Password: ${student.password}`);
      console.log(`  Year: ${student.year}, Department: ${student.department}`);
      console.log('');
    });

    console.log('👨‍🏫 FACULTY:');
    faculty.forEach(member => {
      console.log(`  Email: ${member.email}`);
      console.log(`  Password: ${member.password}`);
      console.log(`  Department: ${member.department}, Designation: ${member.designation}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
