const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  tutor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['MONTHLY', 'END_SEM'],
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'],
    default: 'DRAFT'
  },
  query_start: {
    type: Date
  },
  query_end: {
    type: Date
  },
  pdf_path: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Prevent multiple meetings for same month/year/tutor
meetingSchema.index({ tutor_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Meeting', meetingSchema);
