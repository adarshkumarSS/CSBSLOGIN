-- Database schema for frontend
-- Thiagarajar College of Engineering

-- Create database (run this manually if needed)
-- CREATE DATABASE campus_connect_db;

-- Use the database
-- \c campus_connect_db;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roll_number VARCHAR(20) UNIQUE,
    year VARCHAR(5), -- I, II, III, IV
    department VARCHAR(50),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(50),
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
CREATE INDEX IF NOT EXISTS idx_faculty_employee_id ON faculty(employee_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create password reset OTP table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'student' or 'faculty'
    email VARCHAR(150) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_id_student FOREIGN KEY (user_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_id_faculty FOREIGN KEY (user_id) REFERENCES faculty(id) ON DELETE CASCADE
);

-- Create index for password reset OTPs
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);


ALTER TABLE students
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
    ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5),
    ADD COLUMN IF NOT EXISTS community VARCHAR(5),
    ADD COLUMN IF NOT EXISTS re_caste VARCHAR(30),

    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),

    ADD COLUMN IF NOT EXISTS father_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS father_phone VARCHAR(15),
    ADD COLUMN IF NOT EXISTS father_desi VARCHAR(30),
    ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(15),
    ADD COLUMN IF NOT EXISTS mother_desi VARCHAR(30),

    ADD COLUMN IF NOT EXISTS section VARCHAR(10),
    ADD COLUMN IF NOT EXISTS batch VARCHAR(20),
    ADD COLUMN IF NOT EXISTS family_income VARCHAR(10),
    ADD COLUMN IF NOT EXISTS sslc_school_name VARCHAR(30),
    ADD COLUMN IF NOT EXISTS sslc_school_address VARCHAR(150),
    ADD COLUMN IF NOT EXISTS sslc_marks VARCHAR(5),
    ADD COLUMN IF NOT EXISTS tot_sslc_marks VARCHAR(5),
    ADD COLUMN IF NOT EXISTS hsc_school_name VARCHAR(30),
    ADD COLUMN IF NOT EXISTS hsc_school_address VARCHAR(150),
    ADD COLUMN IF NOT EXISTS hsc_marks VARCHAR(5),
    ADD COLUMN IF NOT EXISTS tot_hsc_marks VARCHAR(5),
    ADD COLUMN IF NOT EXISTS hsc_cutoff VARCHAR(5),
    ADD COLUMN IF NOT EXISTS diploma_clg_name VARCHAR(30),
    ADD COLUMN IF NOT EXISTS diploma_clg_address VARCHAR(150),
    ADD COLUMN IF NOT EXISTS diploma_marks VARCHAR(5),
    ADD COLUMN IF NOT EXISTS tot_diploma_marks VARCHAR(5),
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;