// backend/controllers/studentProfileController.js
const {
  findStudentById,
  updateStudentProfile,
} = require("../models/studentmodel");

// Extract auth info regardless of how verifyToken stores it
function getAuthInfo(req) {
  const id = req.user?.id ?? req.userId;
  const userType =
    req.user?.role ?? req.user?.user_type ?? req.userType;
  return { id, userType };
}

// GET /api/students/me
async function getMyStudentProfile(req, res, next) {
  try {
    const { id, userType } = getAuthInfo(req);

    if (!id) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (userType !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can access this endpoint",
      });
    }

    const student = await findStudentById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    console.error("getMyStudentProfile error:", err);
    next(err);
  }
}

// PUT /api/students/me
async function updateMyStudentProfile(req, res, next) {
  try {
    const { id, userType } = getAuthInfo(req);

    if (!id) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (userType !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can update this profile",
      });
    }

    const updated = await updateStudentProfile(id, req.body);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("updateMyStudentProfile error:", err);
    next(err);
  }
}

module.exports = {
  getMyStudentProfile,
  updateMyStudentProfile,
};
