const mongoose = require('mongoose');

const passwordResetOTPSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'user_type_ref',
    required: true
  },
  user_type: {
    type: String,
    required: true,
    enum: ['student', 'faculty']
  },
  // virtual field to help with refPath if needed, but we store user_type string. 
  // For simplicitly in Mongoose, we might not use dynamic ref validation strictly here unless we want to populate manually.
  
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  is_used: {
    type: Boolean,
    default: false
  },
  expires_at: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  // Used for dynamic reference
  user_type_ref: {
    type: String,
    required: true,
    enum: ['Student', 'Faculty'],
    default: function() {
      return this.user_type === 'student' ? 'Student' : 'Faculty';
    }
  }
});

module.exports = mongoose.model('PasswordResetOTP', passwordResetOTPSchema);
