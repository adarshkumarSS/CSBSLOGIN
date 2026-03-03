const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema({
    year: {
        type: String,
        required: true,
        enum: ['I', 'II', 'III', 'IV'],
    },
    subjectName: {
        type: String,
        required: true,
    },
    assignedStaffName: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
