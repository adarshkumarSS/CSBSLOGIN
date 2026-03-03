const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const students = await Student.find({}, 'name email roll_number department');
    const faculty = await Faculty.find({}, 'name email employee_id department designation');

    console.log('\n👨‍🎓 STUDENTS:');
    if (students.length === 0) console.log('  No students found.');
    students.forEach(s => {
      console.log(`  - ${s.name} (${s.email}) | Roll: ${s.roll_number} | Dept: ${s.department}`);
    });

    console.log('\n👨‍🏫 FACULTY:');
    if (faculty.length === 0) console.log('  No faculty found.');
    faculty.forEach(f => {
      console.log(`  - ${f.name} (${f.email}) | ID: ${f.employee_id} | Dept: ${f.department} | Role: ${f.designation}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
