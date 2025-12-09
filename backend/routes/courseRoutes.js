const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const courseController = require('../controllers/courseController');
const { body } = require('express-validator');

// @route   POST api/courses
// @desc    Add a new course mapping
// @access  Private
router.post(
    '/',
    verifyToken,
    [
        body('subject_name', 'Subject Name is required').notEmpty(),
        body('degree', 'Degree is required').notEmpty(),
        body('department', 'Department is required').notEmpty(),
        body('year', 'Year is required').notEmpty(),
        body('semester', 'Semester is required').isNumeric(),
        body('section', 'Section is required').notEmpty(),
        body('academic_year', 'Academic Year is required').notEmpty()
    ],
    courseController.addCourse
);

// @route   GET api/courses/my-courses
// @desc    Get courses for logged in faculty
// @access  Private
router.get('/my-courses', verifyToken, courseController.getMyCourses);

// @route   DELETE api/courses/:id
// @desc    Delete a course
// @access  Private
router.delete('/:id', verifyToken, courseController.deleteCourse);

module.exports = router;
