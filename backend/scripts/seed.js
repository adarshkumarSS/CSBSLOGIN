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

const { calculateSemesterAndYear } = require('../utils/academicHelpers');

    // Load data from generated JSON files
    const students = require('./data/students.json');
    const faculty = require('./data/faculty.json');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await PasswordResetOTP.deleteMany({});

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
      
      const { year, semester } = calculateSemesterAndYear(student.batch);

      await Student.create({
          name: student.name,
          email: student.email,
          password_hash: hashedPassword,
          roll_number: student.roll_number,
          batch: student.batch,
          year: year,
          semester: semester,
          section: 'A', // Default
          degree: 'B.Tech', // Default
          department: student.department,
          phone: student.phone,
          department: student.department,
          phone: student.phone
          // tutor_id: null // Explicitly no tutor initially
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
