const mongoose = require('mongoose');
const Student = require('../models/Student');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const student = await Student.findOne({ email: 'zainadarsh@gmail.com' });
        console.log('Student found:', student ? student.email : 'NOT FOUND');
        
        // Also check if ANY student exists
        const count = await Student.countDocuments();
        console.log('Total Students:', count);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUser();
