const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Student = require('../models/Student');
const { calculateSemesterAndYear } = require('../utils/academicHelpers');

async function updateStudentStatus() {
    try {
        console.log('🔄 Starting academic status update...');

        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB');
        }

        // Get all students
        const students = await Student.find({});
        console.log(`found ${students.length} students.`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            if (!student.batch) {
                console.warn(`⚠️ Skipping student ${student.name} (${student.roll_number}): No batch defined.`);
                skippedCount++;
                continue;
            }

            const { year, semester } = calculateSemesterAndYear(student.batch);

            // Check if update is needed
            if (student.semester !== semester || student.year !== year) {
                student.semester = semester;
                student.year = year;
                await student.save();
                // console.log(`✅ Updated ${student.name}: Sem ${semester}, Year ${year}`);
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`\n🎉 Update complete!`);
        console.log(`   Updated: ${updatedCount}`);
        console.log(`   Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('❌ Error updating student status:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Run if executed directly
if (require.main === module) {
    updateStudentStatus();
}

module.exports = updateStudentStatus;
