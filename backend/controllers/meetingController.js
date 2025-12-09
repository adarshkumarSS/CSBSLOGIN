const Meeting = require('../models/Meeting');
const Query = require('../models/Query');
const MeetingResponse = require('../models/MeetingResponse');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', 'public', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const meetingController = {
  // Create Meeting (Tutor only)
  async createMeeting(req, res) {
    try {
      const { month, year, type, degree, semester, section, custom_questions } = req.body;
      const tutorId = req.user._id || req.user.id;

      // Validate Tutor Role
      if (req.user.role !== 'faculty' && req.user.role !== 'hod') {
        return res.status(403).json({ success: false, message: 'Only tutors can create meetings' });
      }

      /* REMOVED: Check for duplicate meeting to allow multiple meetings per month
      // Check if tutor already created same month/year meeting
      const existing = await Meeting.findOne({
        tutor_id: tutorId,
        month,
        year
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A meeting for this month and year already exists',
          errorType: 'duplicate_meeting'
        });
      }
      */

      const faculty = await Faculty.findById(tutorId);

      if (!faculty) {
        return res.status(404).json({ success: false, message: 'Faculty profile not found' });
      }

      const meeting = await Meeting.create({
        tutor_id: tutorId,
        month,
        year,
        type,
        degree,
        semester,
        section,
        department: faculty.department,
        custom_questions: custom_questions || []
      });

      // Notify Students via Email
      try {
        const { sendEmail, templates } = require('../utils/emailService');
        // Find students in this class
        const students = await Student.find({
            degree,
            semester, // assuming exact match (or check logic based on dynamic year/sem)
            section
            // Optional: Filter by tutor_id if strict assignment required, but usually creation implies access
        });

        if (students.length > 0) {
            const emails = students.map(s => s.email).filter(e => e);
            if (emails.length > 0) {
                // Send individually or BCC? For privacy BCC is better, but loop is simpler for template personalization if needed.
                // Loop helps if we want to personalize, but here generic template is used.
                // We'll use a loop for now to ensure delivery, or BCC if list is large.
                // Given standard class size ~60, loop is acceptable for this scale if async.
                
                // Fire and forget to avoid delaying response too much?
                // Or await to ensure it works?
                // Let's await Promise.all
                const emailPromises = emails.map(email => 
                    sendEmail(email, 'New Meeting Alert', templates.meetingNotification(faculty.name, {
                        type,
                        degree,
                        semester,
                        section
                    }))
                );
                // Don't await fully if we want speed, but user asked to "properly handle".
                // We'll log errors but not fail the request.
                Promise.all(emailPromises).catch(err => console.error('Error sending meeting emails:', err));
            }
        }
      } catch (emailErr) {
        console.error('Email notification setup failed:', emailErr);
      }

      res.status(201).json({
        success: true,
        message: 'Meeting created successfully',
        data: meeting
      });

    } catch (error) {
      console.error('Create meeting error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Submit Meeting Response (Student)
  async submitResponse(req, res) {
    try {
      const { id } = req.params;
      const { answers } = req.body;
      const studentId = req.user._id || req.user.id;

      const meeting = await Meeting.findById(id);
      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      // Check if already submitted
      const existing = await MeetingResponse.findOne({ meeting_id: id, student_id: studentId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Response already submitted' });
      }

      // Validate answers against mandatory questions
      const questions = meeting.custom_questions || [];
      for (const q of questions) {
        if (q.required && !q.conditional?.enabled) {
          const ans = answers.find(a => a.questionId === q.id);
          if (!ans || !ans.answer) {
            return res.status(400).json({ 
              success: false, 
              message: `Missing answer for required question: "${q.question}"` 
            });
          }
        }
        // Basic conditional validation (if dependent question has specific value)
        if (q.conditional?.enabled) {
            const parentAns = answers.find(a => a.questionId === q.conditional.dependsOn);
            if (parentAns && parentAns.answer === q.conditional.value) {
                // Now this question is required
                const ans = answers.find(a => a.questionId === q.id);
                if (q.required && (!ans || !ans.answer)) {
                     return res.status(400).json({ 
                        success: false, 
                        message: `Missing answer for required question: "${q.question}"` 
                      });
                }
            }
        }
      }

      const response = await MeetingResponse.create({
        meeting_id: id,
        student_id: studentId,
        answers
      });

      res.status(201).json({ success: true, message: 'Response submitted', data: response });

    } catch (error) {
      console.error('Submit response error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Open Query Window
  async openWindow(req, res) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id);

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      if (meeting.tutor_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (meeting.status === 'OPEN') {
        return res.status(400).json({ success: false, message: 'Window already open' });
      }
      if (meeting.status === 'COMPLETED') {
        return res.status(400).json({ success: false, message: 'Meeting already completed' });
      }

      meeting.status = 'OPEN';
      meeting.query_start = new Date();
      await meeting.save();

      res.json({ success: true, message: 'Query window opened', data: meeting });

    } catch (error) {
      console.error('Open window error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Close Query Window
  async closeWindow(req, res) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id);

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      if (meeting.tutor_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (meeting.status === 'CLOSED') {
        return res.status(400).json({ success: false, message: 'Window already closed' });
      }

      meeting.status = 'CLOSED';
      meeting.query_end = new Date();
      await meeting.save();

      res.json({ success: true, message: 'Query window closed', data: meeting });

    } catch (error) {
      console.error('Close window error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Generate PDF
  async generatePDF(req, res) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id).populate('tutor_id', 'name department');

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      if (meeting.tutor_id._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const { generateMeetingPDF } = require('../utils/pdfGenerator');

      // 1. Fetch Queries
      const queries = await Query.find({ meeting_id: id }).populate('student_id', 'name roll_number');

      // 2. Fetch All Students in this class assigned to this tutor
      const allStudents = await Student.find({
          degree: meeting.degree,
          semester: meeting.semester, 
          section: meeting.section,
          tutor_id: meeting.tutor_id._id // Only get students assigned to this tutor
      }).select('name roll_number email');

      // 3. Fetch All Responses
      const responses = await MeetingResponse.find({ meeting_id: id }).populate('student_id', 'name roll_number');

      // 4. Identify Pending Students
      const submittedStudentIds = new Set(responses.map(r => r.student_id._id.toString()));
      // Also checking students who submitted queries
      queries.forEach(q => {
          if (q.student_id) submittedStudentIds.add(q.student_id._id.toString());
      });

      const pendingStudents = allStudents.filter(s => !submittedStudentIds.has(s._id.toString()));

      // Generate PDF
      const pdfResult = await generateMeetingPDF({
          meeting,
          queries,
          responses,
          pendingStudents,
          totalStudents: allStudents.length,
          attendanceCount: submittedStudentIds.size
      });

      // Update Meeting
      meeting.status = 'COMPLETED';
      meeting.pdf_path = pdfResult.relativePath;
      await meeting.save();

      res.json({
        success: true,
        message: 'PDF generated successfully',
        data: {
          pdfPath: meeting.pdf_path,
          status: meeting.status
        }
      });

    } catch (error) {
      console.error('Generate PDF error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get Responses for a meeting (Faculty View)
  async getMeetingResponses(req, res) {
      try {
          const { id } = req.params;
          const responses = await MeetingResponse.find({ meeting_id: id })
              .populate('student_id', 'name roll_number email');
          
          res.json({ success: true, data: responses });
      } catch (error) {
          console.error('Get responses error:', error);
          res.status(500).json({ success: false, message: 'Error fetching responses' });
      }
  },

  // Get All Meetings (for HOD or Tutor's view)
  async getMeetings(req, res) {
    try {
      const { role, _id } = req.user;
      const id = _id;
      let filter = {};

      if (role === 'faculty') {
        filter = { tutor_id: id };
      } else if (role === 'student') {
        const student = await Student.findById(id);
        if (student && student.tutor_id) {
          filter = { tutor_id: student.tutor_id };
        } else {
          return res.json({ success: true, data: [] }); // No tutor assigned
        }
      }
      // HOD sees all
      // Requirement: HOD View + download all tutor PDFs.
      // Assuming HOD can see all.

      const meetings = await Meeting.find(filter).sort({ created_at: -1 }).populate('tutor_id', 'name');
      
      // If student, check for submitted responses
      if (role === 'student') {
        const responses = await MeetingResponse.find({ 
            student_id: id, 
            meeting_id: { $in: meetings.map(m => m._id) } 
        });
        const submittedSet = new Set(responses.map(r => r.meeting_id.toString()));
        
        const meetingsWithStatus = meetings.map(m => ({
            ...m.toObject(),
            response_submitted: submittedSet.has(m._id.toString())
        }));
        return res.json({ success: true, data: meetingsWithStatus });
      }

      res.json({ success: true, data: meetings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching meetings' });
    }
  },

  // Get specific meeting details
  async getMeetingById(req, res) {
    try {
      const { id } = req.params;
      const meeting = await Meeting.findById(id).populate('tutor_id', 'name');
      if (!meeting) return res.status(404).json({ success: false, message: 'Not found' });

      res.json({ success: true, data: meeting });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching meeting' });
    }
  },

  // Get Queries for a meeting
  async getMeetingQueries(req, res) {
    try {
      const { id } = req.params;
      // Check access?
      const queries = await Query.find({ meeting_id: id }).populate('student_id', 'name roll_number');
      res.json({ success: true, data: queries });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching queries' });
    }
  }

};

module.exports = meetingController;
