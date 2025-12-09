const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student', // Updated from 'User' to 'Student' for CSBSDIGIT
    },
    subject: {
        type: String,
        required: true,
    },
    staffName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Academic', 'Complaint', 'Doubt', 'Other'],
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Approved', 'Rejected by Coordinator', 'Resolved', 'Unresolved', 'Rejected by Staff'],
        default: 'Pending',
    },
    coordinatorRemarks: {
        type: String,
    },
    staffRemarks: {
        type: String,
    },
    year: {
        type: String, // Snapshot of student's year at time of complaint
        required: true,
    }
}, {
    timestamps: true,
});

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
