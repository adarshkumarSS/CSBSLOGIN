const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password_hash: {
    type: String,
    required: true
  },
  roll_number: {
    type: String,
    required: true,
    unique: true
  },
  year: {
    type: String, // Keeping as String based on usage, or Number
    required: true
  },
  department: {
    type: String,
    required: true
  },
  phone: {
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
  degree: {
    type: String,
    required: true
  },
  tutor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  role: {
    type: String,
    default: 'student'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update updated_at on save
studentSchema.pre('save', function() {
  this.updated_at = Date.now();
});

module.exports = mongoose.model('Student', studentSchema);
