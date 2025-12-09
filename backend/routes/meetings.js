const express = require('express');
const { body } = require('express-validator');
const meetingController = require('../controllers/meetingController');
const queryController = require('../controllers/queryController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// MEETING ROUTES

// Create Meeting (Tutor only)
router.post(
  '/', 
  verifyToken, 
  requireRole(['faculty', 'hod']),
  [
    body('month').isInt({ min: 1, max: 12 }),
    body('year').isInt({ min: 2020 }),
    body('type').isIn(['MONTHLY', 'END_SEM']),
    body('degree').notEmpty(),
    body('semester').isInt(),
    body('section').notEmpty()
  ],
  meetingController.createMeeting
);

// Get All Meetings (Filtered by role in controller)
router.get('/', verifyToken, meetingController.getMeetings);
router.get('/:id', verifyToken, meetingController.getMeetingById);

// Open/Close Window (Tutor)
router.patch('/:id/open', verifyToken, requireRole(['faculty', 'hod']), meetingController.openWindow);
router.patch('/:id/close', verifyToken, requireRole(['faculty', 'hod']), meetingController.closeWindow);

// Generate PDF
router.post('/:id/generate-pdf', verifyToken, requireRole(['faculty', 'hod']), meetingController.generatePDF);

// Submit Response (Student only) - NEW
router.post('/:id/submit', verifyToken, requireRole(['student']), meetingController.submitResponse);

// QUERY ROUTES

// Submit Query (Student)
router.post(
    '/:meetingId/query',
    verifyToken,
    requireRole(['student']),
    [
        body('subject').trim().notEmpty().withMessage('Subject is required'),
        body('concern').trim().isLength({ min: 5 }).withMessage('Concern must be at least 5 characters long')
    ],
    queryController.submitQuery
);

// Get Queries for a meeting
router.get('/:id/queries', verifyToken, meetingController.getMeetingQueries);

module.exports = router;
