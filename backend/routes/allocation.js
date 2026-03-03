const express = require('express');
const router = express.Router();
const { verifyToken, requireHod } = require('../middleware/auth');
const { getStudents, getFaculties, assignTutor, getAssignedClasses } = require('../controllers/allocationController');

// HOD Routes
router.get('/students', verifyToken, requireHod, getStudents);
router.get('/faculties', verifyToken, requireHod, getFaculties);
router.post('/assign', verifyToken, requireHod, assignTutor);

// Faculty Routes
router.get('/my-classes', verifyToken, getAssignedClasses);

module.exports = router;
