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
    // Validate required questions logic (frontend side)
    const questions = activeMeeting.custom_questions || [];
    for (const q of questions) {
        if (q.required) {
            // Check conditional
            if (q.conditional.enabled) {
                const parentAns = meetingAnswers.find(a => a.questionId === q.conditional.dependsOn)?.answer;
                if (parentAns !== q.conditional.value) continue; // Skip if condition not met
            }
            const ans = meetingAnswers.find(a => a.questionId === q.id)?.answer;
            if (!ans) {
                toast.error(`Please answer: ${q.question}`);
                return;
            }
        }
    }

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={`border-l-4 shadow-md ${editingQueryId ? 'border-l-orange-500' : 'border-l-primary'}`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-xl">
                {editingQueryId ? 'Edit Rejected Query' : 'Submit New Query'}
              </CardTitle>
              <CardDescription>
                {editingQueryId ? 'Update your query for re-evaluation.' : 'Select an active meeting to submit your query.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {openMeetings.length > 0 || editingQueryId ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Meeting</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={activeMeeting?._id || ''}
                      disabled={!!editingQueryId} // Lock meeting selection when editing
                      onChange={e => {
                        const selected = openMeetings.find(m => m._id === e.target.value);
                        if (selected) setActiveMeeting(selected);
                      }}
                    >
                      {openMeetings.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.type} - {m.month}/{m.year}
                        </option>
                      ))}
                      {/* If editing a meeting not in open list (edge case), ensure it shows - logic simplistic for now */}
                    </select>
                    {activeMeeting && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> Tutor: {activeMeeting.tutor_id?.name}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="E.g., Hostel Maintenance, Academic Leave"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concern">Concern Description</Label>
                      <Textarea
                        id="concern"
                        value={concern}
                        onChange={e => setConcern(e.target.value)}
                        placeholder="Please describe your query in detail..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitQuery} className="flex-1" disabled={!concern.trim() || !subject.trim()}>
                        <Send className="w-4 h-4 mr-2" /> {editingQueryId ? 'Update Query' : 'Submit Query'}
                      </Button>
                      {editingQueryId && (
                        <Button variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No active meetings available at this moment.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Form Card (if custom questions exist AND not submitted) */}
          {activeMeeting && (activeMeeting.custom_questions || []).length > 0 && !activeMeeting.response_submitted && (
            <Card className="border-l-4 border-l-purple-500 shadow-md">
                <CardHeader>
                    <CardTitle>Mandatory Meeting Form</CardTitle>
                    <CardDescription>Please answer the following questions required by your tutor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(activeMeeting.custom_questions || []).map((q, idx) => {
                         // Check visibility
                         if (q.conditional.enabled) {
                             const parentAns = meetingAnswers.find(a => a.questionId === q.conditional.dependsOn)?.answer;
                             if (parentAns !== q.conditional.value) return null;
                         }

                         return (
                            <div key={q.id} className="space-y-2">
                                <Label>{q.question} {q.required && <span className="text-red-500">*</span>}</Label>
                                {q.type === 'text' && <Input value={meetingAnswers.find(a=>a.questionId===q.id)?.answer || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} />}
                                {q.type === 'textarea' && <Textarea value={meetingAnswers.find(a=>a.questionId===q.id)?.answer || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} />}
                                {q.type === 'radio' && (
                                    <div className="flex gap-4">
                                        {q.options.map(opt => (
                                            <div key={opt} className="flex items-center space-x-2">
                                                <input type="radio" name={q.id} id={`${q.id}-${opt}`} value={opt} 
                                                    checked={meetingAnswers.find(a=>a.questionId===q.id)?.answer === opt}
                                                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                                                />
                                                <label htmlFor={`${q.id}-${opt}`}>{opt}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {q.type === 'checkbox' && (
                                     <div className="flex gap-4">
                                        {q.options.map(opt => (
                                            <div key={opt} className="flex items-center space-x-2">
                                                <input type="checkbox" id={`${q.id}-${opt}`} value={opt}
                                                     // complex logic for multi-select, simplifying to single select for now or simple string array
                                                     // Assuming simple string array in backend.
                                                     // For simplicity in this iteration, treating checkbox like radio or just single select if array logic is too complex for this snippet.
                                                     // Actually, let's implement array logic
                                                     onChange={e => {
                                                         const current = (meetingAnswers.find(a=>a.questionId===q.id)?.answer || []) as string[];
                                                         const newVal = e.target.checked ? [...current, opt] : current.filter(x => x !== opt);
                                                         handleAnswerChange(q.id, newVal);
                                                     }}
                                                     checked={((meetingAnswers.find(a=>a.questionId===q.id)?.answer || []) as string[]).includes(opt)}
                                                />
                                                <label htmlFor={`${q.id}-${opt}`}>{opt}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                         );
                    })}
                    <Button onClick={handleSubmitResponse} className="w-full bg-purple-600 hover:bg-purple-700">Submit Form</Button>
                </CardContent>
            </Card>
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

          <div className="space-y-4">
            {filteredQueries.length === 0 ? (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  {searchTerm ? (
                    <>
                      <Search className="w-12 h-12 mb-4 opacity-20" />
                      <p>No queries match your search.</p>
                    </>
                  ) : (
                    <>
                      <Send className="w-12 h-12 mb-4 opacity-20" />
                      <p>No queries submitted yet.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredQueries.map(q => (
                <Card key={q._id} className={`overflow-hidden transition-all hover:shadow-sm border-l-4 group ${(q.status === 'REJECTED' && (q.meeting_id as any)?.status === 'OPEN') ? 'border-l-red-500 hover:bg-red-50/10 cursor-pointer' : 'border-l-transparent hover:border-l-primary'}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3 justify-between">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base leading-none group-hover:text-primary transition-colors">
                              {q.subject}
                            </h3>
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
                              {(q.meeting_id as any)?.type === 'MONTHLY' ? 'Monthly' : 'End Sem'}
                              {(q.meeting_id as any)?.month && ` ${(q.meeting_id as any).month}/${(q.meeting_id as any).year}`}
                            </span>
                          </div>
                          <div className="md:hidden">
                            <StatusBadge status={q.status} />
                          </div>
                        </div>

                        <p className="text-sm text-foreground/80 leading-snug">
                          {q.concern}
                        </p>

                        {q.tutor_remark && (
                          <div className="mt-2 text-xs bg-accent/10 p-2 rounded border border-accent/20 flex gap-2 items-start">
                            <User className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent-foreground" />
                            <span className="text-foreground/90"><span className="font-semibold">Tutor:</span> {q.tutor_remark}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(q.created_at).toLocaleDateString()}

                          {q.status === 'REJECTED' && (q.meeting_id as any)?.status === 'OPEN' && (
                            <Button variant="link" size="sm" className="h-auto p-0 text-red-600 font-semibold ml-2" onClick={() => handleEditQuery(q)}>
                              Edit & Resubmit
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:flex flex-col items-end gap-1 min-w-[120px]">
                        <StatusBadge status={q.status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'APPROVED':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
    default:
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  }
}

export default StudentDashboard;
