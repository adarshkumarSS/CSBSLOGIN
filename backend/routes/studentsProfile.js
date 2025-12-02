// backend/routes/students.js
const express = require("express");
const { verifyToken } = require("../middleware/auth");
const {
  getMyStudentProfile,
  updateMyStudentProfile,
} = require("../controllers/studentProfileController");

const router = express.Router();

// Logged-in student: get own profile
router.get("/me", verifyToken, getMyStudentProfile);

// Logged-in student: update own profile
router.put("/me", verifyToken, updateMyStudentProfile);

module.exports = router;
