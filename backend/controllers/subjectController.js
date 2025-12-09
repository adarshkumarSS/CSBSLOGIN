const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subject');

// @desc    Get all subjects and staff mappings
// @route   GET /api/subjects
// @access  Private (Authenticated users)
const getSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({});
    res.json(subjects);
});

// @desc    Create/Add a subject mapping
// @route   POST /api/subjects
// @access  Private
const addSubject = asyncHandler(async (req, res) => {
    const { year, subjectName, assignedStaffName } = req.body;

    const subject = new Subject({
        year,
        subjectName,
        assignedStaffName
    });

    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
});

const seedSubjects = asyncHandler(async (req, res) => {
    // Copied from Mock Data
    const mockSubjectsAndStaff = [
        { year: 'I', subjectName: 'Mathematics', assignedStaffName: 'Dr. Kumar Patel' },
        { year: 'I', subjectName: 'Physics', assignedStaffName: 'Prof. Lakshmi Rao' },
        { year: 'I', subjectName: 'Chemistry', assignedStaffName: 'Dr. Arvind Mehta' },
        { year: 'I', subjectName: 'Programming in C', assignedStaffName: 'Prof. Suresh Reddy' },
        { year: 'II', subjectName: 'Data Structures', assignedStaffName: 'Dr. Priya Sharma' },
        { year: 'II', subjectName: 'Digital Electronics', assignedStaffName: 'Prof. Anand Kumar' },
        { year: 'II', subjectName: 'Discrete Mathematics', assignedStaffName: 'Dr. Radha Krishna' },
        { year: 'II', subjectName: 'Object Oriented Programming', assignedStaffName: 'Prof. Vijay Menon' },
        { year: 'III', subjectName: 'Operating Systems', assignedStaffName: 'Prof. Venkat Rao' },
        { year: 'III', subjectName: 'Database Management', assignedStaffName: 'Dr. Sneha Gupta' },
        { year: 'III', subjectName: 'Computer Networks', assignedStaffName: 'Prof. Arun Nair' },
        { year: 'III', subjectName: 'Software Engineering', assignedStaffName: 'Dr. Kavita Sharma' },
        { year: 'IV', subjectName: 'Machine Learning', assignedStaffName: 'Dr. Ramesh Iyer' },
        { year: 'IV', subjectName: 'Cloud Computing', assignedStaffName: 'Prof. Deepak Singh' },
        { year: 'IV', subjectName: 'Cyber Security', assignedStaffName: 'Dr. Priya Menon' },
        { year: 'IV', subjectName: 'Big Data Analytics', assignedStaffName: 'Prof. Sanjay Kumar' },
    ];

    await Subject.deleteMany({});
    const createdSubjects = await Subject.insertMany(mockSubjectsAndStaff);
    res.json(createdSubjects);
});

module.exports = { getSubjects, addSubject, seedSubjects };
