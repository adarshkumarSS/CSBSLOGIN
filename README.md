# 🎓 CSBS Digital Campus

A campus management application built with **MERN Stack** (MongoDB, Express, React, Node.js).

## 🛠️ Prerequisites
- **Node.js** (v18+)
- **MongoDB Atlas** account (or local MongoDB)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment
Create `backend/.env` with the following:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```
> **Important:** Whitelist your IP address in MongoDB Atlas Network Access.

### 3. Seed Database
Populate the database with sample students and faculty:
```bash
cd backend
npm run seed
```

### 4. Run Application
Open two terminals:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```
Access at: `http://localhost:8080`

## 👥 Sample Credentials

**Students:**
- Email: `arun.kumar@student.tce.edu`
- Password: `student123`

**Faculty:**
- Email: `rajesh.kumar@tce.edu`
- Password: `faculty123`

**HOD:**
- Email: `saravanan.hod@tce.edu`
- Password: `hod123`
