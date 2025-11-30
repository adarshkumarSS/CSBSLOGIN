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
