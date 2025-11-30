# 🎓 Frontend Application - Thiagarajar College of Engineering

A comprehensive frontend application for campus management with separate authentication for students and faculty members. Built with React and modern technologies for seamless user experience and robust security.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Sample Users & Credentials](#sample-users--credentials)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your system:

### 1. **Git**
```bash
# Download from: https://git-scm.com/downloads
git --version  # Verify installation
```

### 2. **Node.js** (v18 or higher)
```bash
# Download from: https://nodejs.org/
node --version   # Should show v18.x.x or higher
npm --version    # Should show 8.x.x or higher
```

### 3. **PostgreSQL** (v12 or higher)
```bash
# Download from: https://www.postgresql.org/download/

# Windows: Use the installer and set up a user
# Default credentials: postgres / password

# Verify installation
psql --version

# Start PostgreSQL service (if not auto-started)
# Windows: Services → postgresql-x64-13 → Start
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

## 📦 Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/frontend.git
cd frontend
```

### Step 2: Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd ../frontend
npm install
```

## 🗄️ Database Setup

### Step 1: Create Database User (PostgreSQL)
```bash
# Open PostgreSQL command line (psql)
psql -U postgres

# Inside psql, create user and database:
CREATE USER postgres WITH PASSWORD 'password';
ALTER USER postgres CREATEDB;
CREATE DATABASE campus_connect_db OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE campus_connect_db TO postgres;
\q
```

### Step 2: Set Up Database Schema and Tables
```bash
# From project root directory
cd backend

# Create database, tables, and indexes
npm run setup-db
```

**Expected Output:**
```
✅ Database 'campus_connect_db' created successfully!
✅ Tables created successfully!
✅ Indexes created successfully!
✅ Triggers created successfully!
🎉 Database setup completed!
```

### Step 3: Seed Database with Sample Data
```bash
# Still in backend directory
npm run seed
```

**Expected Output:**
```
🌱 Starting database seeding...
🧹 Clearing existing data...
👨‍🎓 Seeding students...
👨‍🏫 Seeding faculty...
✅ Database seeding completed successfully!
📋 Sample Login Credentials:
[...list of users...]
🎉 Seeding process completed!
```

## ⚙️ Environment Configuration

### Step 1: Create Environment File
```bash
# In backend directory
cp .env.example .env  # or create manually
```

### Step 2: Configure Environment Variables
Edit `backend/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_connect_db
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (for development)
FRONTEND_URL=http://localhost:8080
```

**Security Note:** Never commit the `.env` file to version control!

## 🚀 Running the Application

### Step 1: Start Backend Server
```bash
# Terminal 1: Backend
cd backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
📡 Connected to PostgreSQL database
🔄 Database synchronized
```

### Step 2: Start Frontend Development Server
```bash
# Terminal 2: Frontend
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.4.9  ready in 300 ms
➜  Local:   http://localhost:8080/
➜  Network: http://192.168.1.xxx:8080/
➜  press h to show help
```

### Step 3: Access the Application
1. **Open Browser**: Go to `http://localhost:8080`
2. **Login Page**: Use credentials from the list below
3. **Dashboard**: Access role-specific features

## 👥 Sample Users & Credentials

### 👨‍🎓 **Students** (5 users)
| Name | Email | Password | Roll Number | Year | Department |
|------|-------|----------|-------------|------|------------|
| Arun Kumar | `arun.kumar@student.tce.edu` | `student123` | CS001 | III | Computer Science and Business Systems |
| Priya Sharma | `priya.sharma@student.tce.edu` | `student123` | CS002 | II | Computer Science and Business Systems |
| Rahul Singh | `rahul.singh@student.tce.edu` | `student123` | ME001 | IV | Computer Science and Business Systems |
| Sneha Patel | `sneha.patel@student.tce.edu` | `student123` | EE001 | I | Computer Science and Business Systems |
| Vikram Rao | `vikram.rao@student.tce.edu` | `student123` | CE001 | III | Computer Science and Business Systems |

### 👨‍🏫 **Faculty** (6 users)
| Name | Email | Password | Employee ID | Department | Designation |
|------|-------|----------|-------------|------------|-------------|
| Dr. Rajesh Kumar | `rajesh.kumar@tce.edu` | `faculty123` | FAC001 | Computer Science and Business Systems | Professor |
| Dr. Meera Iyer | `meera.iyer@tce.edu` | `faculty123` | FAC002 | Computer Science and Business Systems | Associate Professor |
| Prof. Suresh Reddy | `suresh.reddy@tce.edu` | `faculty123` | FAC003 | Computer Science and Business Systems | Assistant Professor |
| Dr. Anitha Venkatesh | `anitha.venkatesh@tce.edu` | `faculty123` | FAC004 | Computer Science and Business Systems | Professor |
| Prof. Ramesh Gupta | `ramesh.gupta@tce.edu` | `faculty123` | FAC005 | Computer Science and Business Systems | Associate Professor |
| **Dr. Saravanan HOD** | `saravanan.hod@tce.edu` | `hod123` | HOD001 | Computer Science and Business Systems | **HOD** |

### 🎯 **Special Notes:**
- **HOD Account**: Has administrative privileges for user management
- **Email Domains**:
  - Students: `@student.tce.edu`
  - Faculty: `@tce.edu`
- **Password Patterns**: `student123` for students, `faculty123` for faculty, `hod123` for HOD

## 📋 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### User Management Endpoints (HOD Only)
```http
GET /api/users/search?search=term&role=student&year=III
Authorization: Bearer <jwt_token>

POST /api/users
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "student",
  "name": "John Doe",
  "email": "john.doe@student.tce.edu",
  "password": "password123",
  "rollNumber": "CS101",
  "year": "I",
  "department": "Computer Science and Business Systems"
}
```

## 📁 Project Structure

```
frontend/
├── backend/                          # Node.js/Express Backend
│   ├── config/
│   │   └── database.js              # Database connection
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   └── userController.js        # User management logic
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js                  # Auth routes
│   │   └── users.js                 # User management routes
│   ├── scripts/
│   │   ├── schema.sql               # Database schema
│   │   ├── seed.js                  # Sample data
│   │   └── setup-db.js              # Database setup script
│   ├── .env                         # Environment variables
│   ├── package.json
│   └── server.js                    # Express server
│
├── frontend/               # React Frontend
│   ├── public/
│   │   ├── asset/
│   │   │   └── logo.png
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Navigation.tsx        # Top navigation bar
│   │   │   └── DashboardLayout.tsx   # Layout wrapper
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Authentication state
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── SelectYear.tsx
│   │   │   ├── UserManagement.tsx    # HOD user management
│   │   │   └── dashboards/           # Role-specific dashboards
│   │   │       ├── StudentDashboard.tsx
│   │   │       ├── FacultyDashboard.tsx
│   │   │       └── HodDashboard.tsx
│   │   ├── App.tsx                   # Main app component
│   │   └── main.tsx                  # React entry point
│   ├── index.css                     # Global styles & CSS variables
│   ├── package.json
│   └── vite.config.ts                # Vite configuration
│
├── package.json                      # Root package.json (monorepo)
└── README.md                         # This file
```

## 🔧 Available Scripts

### Backend Scripts
```bash
cd backend

npm start          # Production server
npm run dev        # Development server (with auto-reload)
npm run setup-db   # Create database and tables
npm run seed       # Populate database with sample data
```

### Frontend Scripts
```bash
cd frontend

npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. **Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

#### 2. **Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in .env file
```

#### 3. **Module Not Found Errors**
```bash
npm install  # Reinstall dependencies
```

#### 4. **Database Seeding Fails**
```bash
# Ensure database exists and user has permissions
npm run setup-db
npm run seed
```

#### 5. **CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Backend server must be running on port 5000
- Frontend configured to proxy API calls to backend

#### 6. **Authentication Issues**
- Clear browser localStorage: `localStorage.clear()`
- Restart both servers
- Check JWT_SECRET in `.env`

#### 7. **Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Development Tips
- **Use different terminals** for backend and frontend
- **Check browser console** for frontend errors
- **Check terminal output** for backend errors
- **Use database GUI tools** like pgAdmin or DBeaver for debugging

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based sessions
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized database queries
- **CORS Protection**: Configured for secure cross-origin requests
- **Role-Based Access Control**: Separate permissions for each user type

## 🎯 Features Overview

### Student Features
- ✅ Secure authentication and profile management
- ✅ Year-wise organization (I, II, III, IV)
- ✅ Department-specific dashboards
- ✅ Responsive mobile-friendly interface

### Faculty Features
- ✅ Professional authentication system
- ✅ Department and designation display
- ✅ Staff-specific dashboard access
- ✅ Administrative privileges (HOD role)

### HOD (Head of Department) Features
- ✅ All faculty features
- ✅ User management system
- ✅ Add/edit/delete users
- ✅ Administrative oversight

## 📞 Support & Contributing

### Getting Help
1. **Check this README** for common issues
2. **Review troubleshooting section** above
3. **Check GitHub Issues** for known problems
4. **Create an Issue** with detailed error logs

### Development Guidelines
- Follow existing code style and structure
- Add tests for new features
- Update documentation for API changes
- Use meaningful commit messages

## 📝 License

**MIT License** - Thiagarajar College of Engineering

---

## 🎓 About Thiagarajar College of Engineering

Thiagarajar College of Engineering (TCE) is a Government-aided institution located in Madurai, Tamil Nadu, India. It is affiliated to Anna University, Chennai, and accredited by NBA and NAAC with the highest 'A++' grade.

**Frontend** is designed to streamline campus management and enhance the digital experience for students and faculty members.

---

**🚀 Happy Coding! May your development environment be bug-free and your features work flawlessly!**
#
