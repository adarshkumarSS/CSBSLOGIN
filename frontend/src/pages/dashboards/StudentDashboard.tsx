import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Clock, CheckCircle, XCircle, Search, Calendar, User } from 'lucide-react';
import MeetingResponseForm from '@/components/student/MeetingResponseForm';
import QuerySubmissionForm from '@/components/student/QuerySubmissionForm';
import QueryHistoryList from '@/components/student/QueryHistoryList';

interface Meeting {
  _id: string;
  month: number;
  year: number;
  type: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
  tutor_id: { name: string };
  custom_questions?: CustomQuestion[];
  response_submitted?: boolean;
}

interface CustomQuestion {
    id: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox';
    question: string;
    options: string[];
    required: boolean;
    conditional: { enabled: boolean; dependsOn?: string; value?: string };
}

interface Query {
  _id: string;
  subject: string;
  concern: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  tutor_remark?: string;
  created_at: string;
  meeting_id?: Meeting;
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [openMeetings, setOpenMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [historyQueries, setHistoryQueries] = useState<Query[]>([]);
  const [subject, setSubject] = useState('');
  const [concern, setConcern] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);

  // Meeting Form State
  const [meetingAnswers, setMeetingAnswers] = useState<{questionId: string, answer: any}[]>([]);

  const handleAnswerChange = (qId: string, val: any) => {
    const existing = meetingAnswers.find(a => a.questionId === qId);
    if (existing) {
        setMeetingAnswers(meetingAnswers.map(a => a.questionId === qId ? { ...a, answer: val } : a));
    } else {
        setMeetingAnswers([...meetingAnswers, { questionId: qId, answer: val }]);
    }
  };

  const handleSubmitResponse = async () => {
    if (!activeMeeting) return;
    try {
        await api.post(`/meetings/${activeMeeting._id}/submit`, { answers: meetingAnswers });
        toast.success("Meeting form submitted successfully!");
        setMeetingAnswers([]);
        // Update local state to hide form
        setActiveMeeting({ ...activeMeeting, response_submitted: true });
        // Also update in list
        setOpenMeetings(openMeetings.map(m => m._id === activeMeeting._id ? { ...m, response_submitted: true } : m));
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to submit form");
    }
  };

  const fetchData = async () => {
    try {
      // 1. Fetch all meetings to find OPEN ones
      const res = await api.get('/meetings');
      const meetings: Meeting[] = res.data.data;
      const opened = meetings.filter(m => m.status === 'OPEN');
      setOpenMeetings(opened);

      // Auto-select first open meeting if none selected
      if (opened.length > 0 && !activeMeeting && !editingQueryId) {
        setActiveMeeting(opened[0]);
      }

      // 2. Fetch full query history
      const histRes = await api.get('/queries/my-history');
      if (histRes.data.success) {
        setHistoryQueries(histRes.data.data);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditQuery = (query: Query) => {
    // Only allow editing if meeting is OPEN (should be checked by backend too, but nice for UI)
    // Find the meeting for this query
    const meeting = (query.meeting_id as any);
    if (meeting.status !== 'OPEN') {
      toast.error("Cannot edit query: Meeting window is closed.");
      return;
    }

    setEditingQueryId(query._id);
    setSubject(query.subject);
    setConcern(query.concern);
    // Find matching meeting
    const matchedMeeting = openMeetings.find(m => m._id === meeting._id);
    if (matchedMeeting) {
      setActiveMeeting(matchedMeeting);
    } else {
      // If exact meeting object isn't in openMeetings list (rare if it IS open), create temp or fetch? 
      // For now, assume it's in the list if open.
      // Or manually set active meeting structure
      setActiveMeeting(meeting);
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingQueryId(null);
    setSubject('');
    setConcern('');
    // Reset active meeting to default if needed, or keep current
    if (openMeetings.length > 0) setActiveMeeting(openMeetings[0]);
  };

  const handleSubmitQuery = async () => {
    if (!activeMeeting || !concern.trim() || !subject.trim()) return;
    try {
      if (editingQueryId) {
        // Update existing query
        await api.put(`/queries/${editingQueryId}`, { subject, concern });
        toast.success('Query updated successfully');
        setEditingQueryId(null);
      } else {
        // Create new query
        await api.post(`/meetings/${activeMeeting._id}/query`, { subject, concern });
        toast.success('Query submitted successfully');
      }

      setSubject('');
      setConcern('');
      fetchData(); // Refresh history
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit query');
    }
  };

  const title = user?.role === 'hod' ? 'HOD View - Student Dashboard' : 'Student Dashboard';
  const subtitle = `Welcome, ${user?.name}!`;

  const filteredQueries = historyQueries.filter(q => {
    const matchesSearch =
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.concern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tutor_remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.meeting_id as any)?.tutor_id?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || (q.meeting_id as any)?.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <DashboardLayout title={title} subtitle={subtitle} showBackToHod={true}>
      <div className="space-y-8">
        {/* Stats Cards */}
        {/* Compact Stats Row */}
        <div className="flex flex-wrap gap-3 items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                        <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">My Queries</p>
                        <p className="text-sm font-bold leading-none">{historyQueries.length}</p>
                    </div>
                </div>
                <div className="w-px bg-border h-8 self-center mx-1"></div>
                <div className="flex items-center gap-2">
                    <div className="bg-yellow-100 p-1.5 rounded-full">
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                        <p className="text-sm font-bold leading-none text-yellow-700">{historyQueries.filter(q => q.status === 'PENDING').length}</p>
                    </div>
                </div>
                <div className="w-px bg-border h-8 self-center mx-1"></div>
                <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-1.5 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resolved</p>
                        <p className="text-sm font-bold leading-none text-green-700">{historyQueries.filter(q => q.status === 'APPROVED' || q.status === 'REJECTED').length}</p>
                    </div>
                </div>
                <div className="w-px bg-border h-8 self-center mx-1"></div>
                <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-1.5 rounded-full">
                        <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Open Mtgs</p>
                        <p className="text-sm font-bold leading-none text-purple-700">{openMeetings.length}</p>
                    </div>
                </div>
            </div>
            
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Actions */}
        <div className="lg:col-span-1 space-y-6">
          <QuerySubmissionForm 
            openMeetings={openMeetings}
            activeMeeting={activeMeeting}
            editingQueryId={editingQueryId}
            subject={subject}
            concern={concern}
            onMeetingChange={(id) => { const m = openMeetings.find(x => x._id === id); if (m) setActiveMeeting(m); }}
            onSubjectChange={setSubject}
            onConcernChange={setConcern}
            onSubmit={handleSubmitQuery}
            onCancelEdit={cancelEdit}
          />

          {/* Meeting Form Card (if custom questions exist AND not submitted) */}
          {activeMeeting && (activeMeeting.custom_questions || []).length > 0 && !activeMeeting.response_submitted && (
            <MeetingResponseForm
                questions={activeMeeting.custom_questions || []}
                answers={meetingAnswers}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleSubmitResponse}
            />
          )}

        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-lg border shadow-sm">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Query History</h2>
              <p className="text-muted-foreground text-sm">View and track status of your past queries.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Filters */}
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="MONTHLY">Monthly</option>
                <option value="END_SEM">End Sem</option>
              </select>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <QueryHistoryList 
            queries={filteredQueries}
            searchTerm={searchTerm}
            onEdit={handleEditQuery}
          />
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};



export default StudentDashboard;
