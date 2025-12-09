const Query = require('../models/Query');
const Meeting = require('../models/Meeting');
const Student = require('../models/Student');

const queryController = {
  // Submit a query (Student only)
  // Submit a query (Student only)
  async submitQuery(req, res) {
    try {
      const { meetingId } = req.params;
      const { subject, concern } = req.body; // Added subject
      const studentId = req.user._id || req.user.id;

      if (!subject) {
        return res.status(400).json({ success: false, message: 'Subject is required' });
      }

      // 1. Check if meeting exists and is OPEN
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      if (meeting.status !== 'OPEN') {
        return res.status(403).json({
          success: false,
          message: 'Query window is not open for this meeting',
          errorType: 'window_closed'
        });
      }

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }

      if (!student.tutor_id || student.tutor_id.toString() !== meeting.tutor_id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to the tutor conducting this meeting',
          errorType: 'tutor_mismatch'
        });
      }

      // REMOVED: Check for duplicate query (User allows multiple queries)

      // 4. Create Query
      const query = await Query.create({
        meeting_id: meetingId,
        student_id: studentId,
        subject,
        concern,
        status: 'PENDING'
      });

      res.status(201).json({
        success: true,
        message: 'Query submitted successfully',
        data: query
      });

    } catch (error) {
      console.error('Submit query error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update a query (Student only)
  async updateQuery(req, res) {
    try {
      const { id } = req.params;
      const { subject, concern } = req.body;
      const studentId = req.user._id || req.user.id;

      const query = await Query.findById(id).populate('meeting_id');
      if (!query) {
        return res.status(404).json({ success: false, message: 'Query not found' });
      }

      if (query.student_id.toString() !== studentId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }

      if (query.status !== 'PENDING' && query.status !== 'REJECTED') {
        return res.status(400).json({ success: false, message: 'Query is locked' });
      }

      if (query.meeting_id.status !== 'OPEN') {
        return res.status(400).json({ success: false, message: 'Meeting window closed' });
      }

      if (subject) query.subject = subject;
      if (concern) query.concern = concern;

      // Reset status to PENDING if it was REJECTED
      query.status = 'PENDING';
      // Clear previous remark if any, or keep it history? Usually clear or move to history. 
      // For now, let's keep the old remark but status is pending, so it shows up for review again.
      // Optionally could clear: query.tutor_remark = undefined; 

      await query.save();

      res.json({ success: true, data: query });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Review a query (Tutor only)
  async reviewQuery(req, res) {
    try {
      const { id } = req.params; // Query ID
      const { status, tutor_remark } = req.body;
      const tutorId = req.user._id || req.user.id;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      if (!tutor_remark && status === 'APPROVED') {
        // Requirement specifically says "Cannot mark without remark" (assumed for both, but definitely for actions)
        // Actually prompt said "Tutor forgets remark but approves -> Block"
        return res.status(400).json({ success: false, message: 'Remark is required' });
      }

      const query = await Query.findById(id).populate('meeting_id');
      if (!query) {
        return res.status(404).json({ success: false, message: 'Query not found' });
      }

      // Check if tutor owns the meeting
      if (query.meeting_id.tutor_id.toString() !== tutorId.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to review this query' });
      }

      // Check if meeting is COMPLETED
      if (query.meeting_id.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot review queries for a completed meeting',
          errorType: 'meeting_completed'
        });
      }

      query.status = status;
      query.tutor_remark = tutor_remark;
      await query.save();

      res.json({
        success: true,
        message: 'Query reviewed successfully',
        data: query
      });

    } catch (error) {
      console.error('Review query error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get queries for tutor (Logs)
  async getTutorQueries(req, res) {
    try {
      const tutorId = req.user._id || req.user.id;
      const { status, search, meeting_status } = req.query;

      // 1. Find all meetings by this tutor
      // If meeting_status is provided (e.g. 'COMPLETED'), filter meetings
      const meetingQuery = { tutor_id: tutorId };
      if (meeting_status) {
        meetingQuery.status = meeting_status;
      }
      const meetings = await Meeting.find(meetingQuery).select('_id');
      const meetingIds = meetings.map(m => m._id);

      // 2. Find queries for these meetings
      let queryFilter = { meeting_id: { $in: meetingIds } };

      if (status) {
        queryFilter.status = status;
      }

      // Search by student name or roll number (requires lookup or reliable population)
      // Since we populate student_id, search is easier after fetch or using aggregate.
      // For simplicity with mongoose find + populate:

      let queries = await Query.find(queryFilter)
        .populate('student_id', 'name roll_number')
        .populate({
          path: 'meeting_id',
          select: 'month year degree semester section status' // meeting details
        })
        .sort({ created_at: -1 });

      // If search is provided, filter in memory (efficient enough for most tutor workloads)
      if (search) {
        const lowerSearch = search.toLowerCase();
        queries = queries.filter(q =>
          (q.student_id?.name?.toLowerCase().includes(lowerSearch)) ||
          (q.student_id?.roll_number?.toLowerCase().includes(lowerSearch)) ||
          (q.concern?.toLowerCase().includes(lowerSearch))
        );
      }

      res.json({
        success: true,
        data: queries
      });

    } catch (error) {
      console.error('Get tutor queries error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get student history
  async getStudentQueryHistory(req, res) {
    try {
      const studentId = req.user._id || req.user.id;
      const queries = await Query.find({ student_id: studentId })
        .populate({
          path: 'meeting_id',
          select: 'month year type status tutor_id',
          populate: { path: 'tutor_id', select: 'name' }
        })
        .sort({ created_at: -1 });

      res.json({
        success: true,
        data: queries
      });
    } catch (error) {
      console.error('Get student history error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = queryController;
