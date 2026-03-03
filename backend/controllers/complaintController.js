const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
const createComplaint = asyncHandler(async (req, res) => {
    const { subject, staffName, type, description, year } = req.body;

    const complaint = new Complaint({
        student: req.user._id,
        subject,
        staffName,
        type,
        description,
        year, // Should be passed from frontend
        status: 'Pending'
    });

    const createdComplaint = await complaint.save();
    res.status(201).json(createdComplaint);
});

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private (All roles with filters)
const getComplaints = asyncHandler(async (req, res) => {
    let complaints;
    const role = req.user.role;

    if (role === 'student') {
        complaints = await Complaint.find({ student: req.user._id }).sort({ createdAt: -1 });
    } else if (role === 'faculty') {
        // Faculty sees complaints where they are the assigned staff
        // AND potentially Class Coordinator logic if applicable. 
        // For now, mirroring 'staff' logic from CCM: filter by name.
        complaints = await Complaint.find({ staffName: req.user.name }).sort({ createdAt: -1 });
    } else if (role === 'hod') {
        complaints = await Complaint.find({}).sort({ createdAt: -1 });
    } else {
        complaints = [];
    }

    const populatedComplaints = await Complaint.find(
        role === 'student' ? { student: req.user._id } :
            role === 'faculty' ? { staffName: req.user.name } : {} // HOD gets empty filter -> all
    ).populate('student', 'name roll_number year registerNumber').sort({ createdAt: -1 });

    res.json(populatedComplaints);
});

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id
// @access  Private (Faculty/HOD)
const updateComplaintStatus = asyncHandler(async (req, res) => {
    const { status, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        res.status(404);
        throw new Error('Complaint not found');
    }

    const role = req.user.role;

    if (role === 'student') {
        res.status(401);
        throw new Error('Students cannot update status');
    }

    if (role === 'faculty') {
        // Allowing faculty to Resolve/Reject/Approve
        // Merging Coordinator/Staff logic: Faculty can set any status for now to avoid blocking workflow
        if (['Approved', 'Rejected by Coordinator', 'Resolved', 'Unresolved', 'Rejected by Staff'].includes(status)) {
            complaint.status = status;
            if (remarks) {
                // If checking 'Approved'/'Rejected by Coordinator', treat as Coordinator
                if (['Approved', 'Rejected by Coordinator'].includes(status)) {
                    complaint.coordinatorRemarks = remarks; 
                } else {
                    complaint.staffRemarks = remarks;
                }
            }
        } else {
            res.status(400);
            throw new Error('Invalid status update for Faculty');
        }
    } else if (role === 'hod') {
        complaint.status = status;
        if (remarks && req.body.remarkType === 'coordinator') complaint.coordinatorRemarks = remarks;
        if (remarks && req.body.remarkType === 'staff') complaint.staffRemarks = remarks;
    }

    const updatedComplaint = await complaint.save();
    res.json(updatedComplaint);
});

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Private
const getComplaintStats = asyncHandler(async (req, res) => {
    let query = {};
    const role = req.user.role;

    if (role === 'student') {
        query = { student: req.user._id };
    } else if (role === 'faculty') {
        query = { staffName: req.user.name };
    }
    // HOD sees all

    const complaints = await Complaint.find(query);

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        approved: complaints.filter(c => c.status === 'Approved').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
        rejected: complaints.filter(c =>
            c.status === 'Rejected by Coordinator' ||
            c.status === 'Rejected by Staff'
        ).length,
        unresolved: complaints.filter(c => c.status === 'Unresolved').length
    };

    res.json(stats);
});

// @desc    Get complaint status counts
// @route   GET /api/complaints/status-counts
// @access  Private
const getComplaintStatusCounts = asyncHandler(async (req, res) => {
    let matchQuery = {};
    const role = req.user.role;

    if (role === 'student') {
        matchQuery = { student: req.user._id };
    } else if (role === 'faculty') {
        matchQuery = { staffName: req.user.name };
    }

    const counts = await Complaint.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        // ... (rest of aggregation logic remains same if fields match)
        {
            $group: {
                _id: null,
                countsByStatus: {
                    $push: {
                        k: '$_id',
                        v: '$count'
                    }
                },
                total: { $sum: '$count' }
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [{ total: '$total' }, { $arrayToObject: '$countsByStatus' }]
                }
            }
        }
    ]);

    const statusMap = {
        Pending: 0,
        Approved: 0,
        'Rejected by Coordinator': 0,
        Resolved: 0,
        Unresolved: 0,
        'Rejected by Staff': 0,
        total: 0
    };

    const result = counts.length > 0 ? { ...statusMap, ...counts[0] } : statusMap;
    res.json(result);
});

// @desc    Generate complaint report (CSV)
// @route   GET /api/complaints/report
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
    const { startDate, endDate, status } = req.query;
    let query = {};
    const role = req.user.role;

    if (role === 'student') {
        query.student = req.user._id;
    } else if (role === 'faculty') {
        query.staffName = req.user.name;
    }

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (status) {
        query.status = status;
    }

    const complaints = await Complaint.find(query)
        .populate('student', 'name roll_number year registerNumber')
        .sort({ createdAt: -1 });

    // Ensure CSV fields match updated model refs
    const csvData = complaints.map(c => ({
        'Complaint ID': c._id,
        'Student Name': c.student?.name || 'N/A',
        'Year': c.year,
        'Subject': c.subject,
        'Staff': c.staffName,
        'Type': c.type,
        'Description': c.description,
        'Status': c.status,
        'Coordinator Remarks': c.coordinatorRemarks || '',
        'Staff Remarks': c.staffRemarks || '',
        'Created Date': c.createdAt.toISOString().split('T')[0],
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=complaints-report-${Date.now()}.csv`);

    const { Parser } = require('json2csv');
    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.send(csv);
});

module.exports = { createComplaint, getComplaints, updateComplaintStatus, getComplaintStats, getComplaintStatusCounts, generateReport };
