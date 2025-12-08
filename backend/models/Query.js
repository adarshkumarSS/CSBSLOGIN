const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  meeting_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  concern: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  tutor_remark: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure a student can only submit one query per meeting
querySchema.index({ meeting_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Query', querySchema);
