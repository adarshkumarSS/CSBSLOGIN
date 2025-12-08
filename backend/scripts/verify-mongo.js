const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

const verifyMigration = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        console.log('🧪 Creating a test student...');
        const testStudent = new Student({
            name: 'Test Setup User',
            email: 'testsetup@tce.edu',
            password_hash: 'hashedPassword123',
            roll_number: 'TEST001',
            year: '3',
            department: 'Computer Science',
            phone: '1234567890'
        });

        const savedUser = await testStudent.save();
        console.log('✅ Test student created:', savedUser._id);

        console.log('🔍 Finding test student...');
        const foundUser = await Student.findOne({ email: 'testsetup@tce.edu' });
        if (foundUser) {
            console.log('✅ Found student:', foundUser.name);
        } else {
            console.error('❌ Could not find created student!');
            process.exit(1);
        }

        console.log('🧹 Cleaning up...');
        await Student.findByIdAndDelete(savedUser._id);
        console.log('✅ Test student deleted.');

        console.log('🎉 Verification successful! MongoDB migration looks good.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
};

verifyMigration();
