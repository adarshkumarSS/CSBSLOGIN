const pool = require('../config/database');

const createPasswordResetTable = async () => {
  try {
    console.log('📝 Creating password_reset_otps table...');

    const query = `
      -- Create password reset OTP table
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_type VARCHAR(20) NOT NULL, -- 'student' or 'faculty'
        email VARCHAR(150) NOT NULL,
        otp VARCHAR(255) NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for password reset OTPs
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);
    `;

    const result = await pool.query(query);
    console.log('✅ password_reset_otps table created successfully');

    // Note: We're not adding foreign key constraints here to avoid issues if the table already exists
    // But in a fresh setup, you should add them in schema.sql

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating password reset table:', error.message);
    process.exit(1);
  }
};

createPasswordResetTable();
