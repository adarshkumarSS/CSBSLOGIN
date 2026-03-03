const express = require('express');
const router = express.Router();
const { getSubjects, addSubject, seedSubjects } = require('../controllers/subjectController');
const { verifyToken: protect, requireRole } = require('../middleware/auth');

router.get('/', protect, getSubjects);
router.post('/', protect, requireRole(['hod', 'faculty']), addSubject); // Restricting add to faculty/hod
router.post('/seed', protect, requireRole(['hod', 'faculty']), seedSubjects);

module.exports = router;
