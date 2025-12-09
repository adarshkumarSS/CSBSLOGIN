const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  faculty_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject_name: {
    type: String,
    required: true
  },
  subject_code: {
    type: String,
    // required: true // Optional for now
  },
  degree: {
    type: String, // B.Tech, M.Tech
    required: true
  },
  department: {
    type: String,
    required: true
  },
  year: {
    type: String, // I, II, III, IV
    required: true
  },
  semester: {
    type: Number, // 1-8
    required: true
  },
  section: {
    type: String, // A, B, C
    required: true
  },
  academic_year: {
    type: String, // e.g., "2025-2026"
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);
