const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// Get students with filters
exports.getStudents = async (req, res) => {
  try {
    const { degree, year, semester, section, min_roll, max_roll } = req.query;
    
    // Build filter
    let filter = {};
    if (degree) filter.degree = degree;
    if (year) filter.year = year;
    if (semester) filter.semester = parseInt(semester);
    if (section) filter.section = section;

    // Optional: Filter by roll number range (if provided)
    if (min_roll && max_roll) {
        filter.roll_number = { $gte: min_roll, $lte: max_roll };
    }

    const students = await Student.find(filter)
      .select('name roll_number degree semester section tutor_id')
      .populate('tutor_id', 'name employee_id')
      .sort({ roll_number: 1 });

    res.json({
        success: true,
        count: students.length,
        data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all faculties for dropdown
exports.getFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.find({ role: { $ne: 'admin' } }) // Exclude admins/superusers if any
            .select('name employee_id department');
        res.json({
            success: true,
            data: faculties
        });
    } catch (error) {
        console.error('Error fetching faculties:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// Assign tutor to students
exports.assignTutor = async (req, res) => {
    try {
        const { studentIds, tutorId } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No students selected' });
        }
        
        if (!tutorId) {
            return res.status(400).json({ success: false, message: 'No tutor selected' });
        }

        // Verify tutor exists
        const tutor = await Faculty.findById(tutorId);
        if (!tutor) {
             return res.status(404).json({ success: false, message: 'Tutor not found' });
        }

        // Update students
        const result = await Student.updateMany(
            { _id: { $in: studentIds } },
            { $set: { tutor_id: tutorId } }
        );

        res.json({
            success: true,
            message: `Successfully assigned ${result.modifiedCount} students to ${tutor.name}`,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error assigning tutor:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get assigned classes for a faculty (For Dashboard)
exports.getAssignedClasses = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const tutorId = new mongoose.Types.ObjectId(req.user._id);

        const classes = await Student.aggregate([
            { $match: { tutor_id: tutorId } },
            { 
                $group: {
                    _id: { 
                        degree: "$degree", 
                        semester: "$semester", 
                        section: "$section",
                        year: "$year" // Add year/batch info if needed
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.semester": 1, "_id.section": 1 } }
        ]);
        
        // Format for frontend
        const formattedClasses = classes.map(c => ({
            degree: c._id.degree,
            semester: c._id.semester,
            section: c._id.section,
            year: c._id.year,
            studentCount: c.count
        }));

        res.json({
            success: true,
            data: formattedClasses
        });
    } catch (error) {
        console.error('Error fetching assigned classes:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
