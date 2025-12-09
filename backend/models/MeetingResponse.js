const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
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
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // String or Array (for checkbox)
      required: true
    }
  }],
  submitted_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure one response per student per meeting
responseSchema.index({ meeting_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('MeetingResponse', responseSchema);
