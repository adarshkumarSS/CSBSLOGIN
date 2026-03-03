const Course = require('../models/Course');
const { validationResult } = require('express-validator');

// @route   POST api/courses
// @desc    Add a new course mapping
// @access  Private (Faculty)
exports.addCourse = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { subject_name, subject_code, degree, department, year, semester, section, academic_year } = req.body;

    try {
        const newCourse = new Course({
            faculty_id: req.user._id,
            subject_name,
            subject_code,
            degree,
            department,
            year,
            semester,
            section,
            academic_year
        });

        const course = await newCourse.save();
        res.json({ success: true, data: course });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/courses/my-courses
// @desc    Get courses for logged in faculty
// @access  Private (Faculty)
exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Course.find({ faculty_id: req.user._id }).sort({ created_at: -1 });
        res.json({ success: true, data: courses });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/courses/:id
// @desc    Delete a course mapping
// @access  Private (Faculty)
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        // Check user
        if (course.faculty_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await course.deleteOne();
        res.json({ success: true, msg: 'Course removed' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.status(500).send('Server Error');
    }
};
