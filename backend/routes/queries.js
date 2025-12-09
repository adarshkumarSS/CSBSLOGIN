const express = require('express');
const { body } = require('express-validator');
const queryController = require('../controllers/queryController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Update Query (Student)
router.put(
    '/:id',
    verifyToken,
    requireRole(['student']),
    [
        body('subject').optional().trim().notEmpty(),
        body('concern').optional().trim().isLength({ min: 5 })
    ],
    queryController.updateQuery
);

// Review Query (Tutor)
router.patch(
    '/:id',
    verifyToken,
    requireRole(['faculty', 'hod']),
    [
        body('status').isIn(['APPROVED', 'REJECTED']),
        body('tutor_remark').optional().trim()
    ],
    queryController.reviewQuery
);

// Get Queries Log (Tutor)
router.get(
    '/logs',
    verifyToken,
    requireRole(['faculty', 'hod']),
    queryController.getTutorQueries
);

module.exports = router;
