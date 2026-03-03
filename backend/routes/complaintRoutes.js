const express = require('express');
const router = express.Router();
const { 
    createComplaint, 
    getComplaints, 
    updateComplaintStatus, 
    getComplaintStats, 
    getComplaintStatusCounts, 
    generateReport 
} = require('../controllers/complaintController');
const { verifyToken: protect } = require('../middleware/auth'); // mapping verifyToken to protect

router.post('/', protect, createComplaint);
router.get('/', protect, getComplaints);
router.get('/stats', protect, getComplaintStats);
router.get('/status-counts', protect, getComplaintStatusCounts);
router.get('/report', protect, generateReport);
router.patch('/:id', protect, updateComplaintStatus);

module.exports = router;
