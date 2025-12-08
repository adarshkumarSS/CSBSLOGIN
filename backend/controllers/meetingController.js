const Meeting = require('../models/Meeting');
const Query = require('../models/Query');
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
      const { month, year, type, degree, semester, section } = req.body;
      const tutorId = req.user._id || req.user.id;

      // Validate Tutor Role
      if (req.user.role !== 'faculty' && req.user.role !== 'hod') {
         return res.status(403).json({ success: false, message: 'Only tutors can create meetings' });
      }

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
        department: faculty.department
      });

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
      const meeting = await Meeting.findById(id).populate('tutor_id', 'name department'); // populate tutor name

      if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

      if (meeting.tutor_id._id.toString() !== req.user._id.toString()) {
         return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      const queries = await Query.find({ meeting_id: id }).populate('student_id', 'name roll_number');

      // Check for pending queries
      const pendingCount = queries.filter(q => q.status === 'PENDING').length;
      if (pendingCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot generate PDF. There are ${pendingCount} pending queries.`,
          errorType: 'pending_queries'
        });
      }

      // Generate HTML Content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; }
            h1 { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
            .header-info { margin-bottom: 20px; font-size: 14px; }
            .header-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; font-size: 14px; }
            th { background-color: #f0f0f0; }
            .signatures { margin-top: 60px; display: flex; justify-content: space-between; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Tutor-Ward Meeting: ${meeting.type === 'MONTHLY' ? 'Monthly' : 'End Semester'} Report</h1>
          
          <div class="header-info">
            <div class="header-row">
              <span>Month: ${new Date(meeting.year, meeting.month - 1).toLocaleString('default', { month: 'long' })} ${meeting.year}</span>
              <span>Department: ${meeting.department}</span>
            </div>
            <div class="header-row">
              <span>Degree: ${meeting.degree}</span>
              <span>Semester: ${meeting.semester}</span>
              <span>Section: ${meeting.section}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Name of Student</th>
                <th>Student Concern</th>
                <th>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              ${queries.map(q => `
                <tr>
                  <td>${q.student_id ? q.student_id.name : 'Unknown'}</td>
                  <td>${q.concern}</td>
                  <td>${q.status === 'APPROVED' ? q.tutor_remark : 'Rejected - ' + q.tutor_remark}</td>
                </tr>
              `).join('')}
              ${queries.length === 0 ? '<tr><td colspan="3" style="text-align:center;">No queries submitted</td></tr>' : ''}
            </tbody>
          </table>

          <div class="signatures">
             <span>Tutor Signature</span>
             <span>HOD Signature</span>
          </div>
        </body>
        </html>
      `;

      // Launch Puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      
      const fileName = `meeting-report-${meeting._id}-${Date.now()}.pdf`;
      const filePath = path.join(reportsDir, fileName);
      
      await page.pdf({ path: filePath, format: 'A4' });
      await browser.close();

      // Update Meeting
      meeting.status = 'COMPLETED';
      meeting.pdf_path = `/reports/${fileName}`;
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
          if(!meeting) return res.status(404).json({success: false, message: 'Not found'});
          
          res.json({ success: true, data: meeting });
      } catch(error) {
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
      } catch(error) {
          res.status(500).json({ success: false, message: 'Error fetching queries' });
      }
  }

};

module.exports = meetingController;
