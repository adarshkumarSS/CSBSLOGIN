const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('../config/database');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

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
    await pool.query('DELETE FROM students');
    await pool.query('DELETE FROM faculty');

    // Insert students
    console.log('👨‍🎓 Seeding students...');
    for (const student of students) {
      const hashedPassword = await bcrypt.hash(student.password, 12);
      await pool.query(
        `INSERT INTO students (name, email, password_hash, roll_number, year, department, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [student.name, student.email, hashedPassword, student.roll_number, student.year, student.department, student.phone]
      );
    }

    // Insert faculty
    console.log('👨‍🏫 Seeding faculty...');
    for (const member of faculty) {
      const hashedPassword = await bcrypt.hash(member.password, 12);
      await pool.query(
        `INSERT INTO faculty (name, email, password_hash, employee_id, department, designation, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [member.name, member.email, hashedPassword, member.employee_id, member.department, member.designation, member.phone]
      );
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
