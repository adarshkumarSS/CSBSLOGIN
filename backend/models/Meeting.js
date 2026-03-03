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
    default: 'OPEN'
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
  custom_questions: [{
    id: String,
    type: {
      type: String,
      enum: ['text', 'textarea', 'radio', 'checkbox'],
      default: 'text'
    },
    question: {
      type: String,
      required: true
    },
    options: [String],
    required: {
      type: Boolean,
      default: true
    },
    conditional: {
      enabled: {
        type: Boolean,
        default: false
      },
      dependsOn: String, // Question ID
      value: String // Value needed to show this question
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Prevent multiple meetings for same month/year/tutor (REMOVED to allow multiple meetings)
// meetingSchema.index({ tutor_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Meeting', meetingSchema);
