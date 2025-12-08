import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, FileText, Lock, Unlock, CheckCircle, XCircle, Search, Filter, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Assuming Badge exists or use span

interface Meeting {
  _id: string;
  month: number;
  year: number;
  type: string;
  degree: string;
  semester: number;
  section: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
  pdf_path?: string;
  tutor_id?: { name: string };
}

interface Query {
  _id: string;
  student_id: { name: string; roll_number: string };
  concern: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  tutor_remark?: string;
  meeting_id?: Meeting;
}

interface AssignedClass {
    degree: string;
    semester: number;
    section: string;
    year: string;
    studentCount: number;
}

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);

  // Create Meeting Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'MONTHLY',
    selectedClassIndex: '' // Index in assignedClasses array
  });

  // Review State
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [remark, setRemark] = useState('');
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  // Logs State
  const [logsOpen, setLogsOpen] = useState(false);
  const [logQueries, setLogQueries] = useState<Query[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logStatus, setLogStatus] = useState<string>('REJECTED'); // Default to REJECTED logs as per request
  const [logMeetingStatus, setLogMeetingStatus] = useState<string>('');
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    fetchMeetings();
    fetchAssignedClasses();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedClasses = async () => {
    try {
        const res = await api.get('/allocation/my-classes');
        setAssignedClasses(res.data.data);
    } catch (e) {
        console.error("Failed to fetch assigned classes", e);
    }
  };

  const fetchLogs = async () => {
      setLogLoading(true);
      try {
          const params = new URLSearchParams();
          if (logStatus && logStatus !== 'ALL') params.append('status', logStatus);
          if (logMeetingStatus && logMeetingStatus !== 'ALL') params.append('meeting_status', logMeetingStatus);
          if (logSearch) params.append('search', logSearch);
          
          const res = await api.get(`/queries/logs?${params.toString()}`);
          setLogQueries(res.data.data);
      } catch (e) { toast.error('Failed to fetch logs'); }
      finally { setLogLoading(false); }
  };

  useEffect(() => {
      if (logsOpen) fetchLogs();
  }, [logsOpen, logStatus, logMeetingStatus]); // Trigger on open or status change. Search requires manual trigger or debounce (let's use button/enter)

  const handleCreateMeeting = async () => {
    if (!formData.selectedClassIndex) {
        toast.error("Please select a class");
        return;
    }
    const cls = assignedClasses[parseInt(formData.selectedClassIndex)];
    const now = new Date();
    try {
      const payload = {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          type: formData.type,
          degree: cls.degree,
          semester: cls.semester,
          section: cls.section
      };
      await api.post('/meetings', payload);
      toast.success('Meeting created successfully');
      setIsCreateOpen(false);
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    }
  };

  const handleWindowToggle = async (meeting: Meeting, action: 'open' | 'close') => {
    try {
      await api.patch(`/meetings/${meeting._id}/${action}`);
      toast.success(`Window ${action}ed successfully`);
      fetchMeetings();
      if (selectedMeeting?._id === meeting._id) {
          setSelectedMeeting(prev => prev ? { ...prev, status: action === 'open' ? 'OPEN' : 'CLOSED' } : null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} window`);
    }
  };

  const handleViewQueries = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setQueriesLoading(true);
    try {
      const res = await api.get(`/meetings/${meeting._id}/queries`);
      setQueries(res.data.data);
    } catch (error) {
       toast.error('Failed to fetch queries');
    } finally {
      setQueriesLoading(false);
    }
  };

  const handleReviewQuery = async () => {
    if (!selectedQuery) return;
    try {
      await api.patch(`/queries/${selectedQuery._id}`, { status: reviewAction, tutor_remark: remark });
      toast.success('Query reviewed successfully');
      setReviewOpen(false);
      // Refresh queries
      const res = await api.get(`/meetings/${selectedMeeting?._id}/queries`);
      setQueries(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to review query');
    }
  };

  const handleGeneratePDF = async (meetingId: string) => {
     try {
         toast.info('Generating PDF...');
         const res = await api.post(`/meetings/${meetingId}/generate-pdf`);
         toast.success('PDF Generated');
         fetchMeetings();
         if (selectedMeeting?._id === meetingId) {
             const updated = { ...selectedMeeting, status: 'COMPLETED' as const, pdf_path: res.data.data.pdfPath };
             setSelectedMeeting(updated);
             const link = document.createElement('a');
             link.href = `http://localhost:5000/public${res.data.data.pdfPath}`;
             link.target = '_blank';
             link.download = `meeting-report.pdf`;
             link.click();
         }
     } catch (error: any) {
         toast.error(error.response?.data?.message || 'Failed to generate PDF');
     }
  };

  const title = "Faculty Dashboard";
  const subtitle = `Welcome, ${user?.name}!`;

  return (
    <DashboardLayout title={title} subtitle={subtitle} showBackToHod={user?.role === 'hod'}>
      <div className="space-y-6">
        
        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setLogsOpen(true)}>
                  <History className="mr-2 h-4 w-4" /> View Query Logs
              </Button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Meeting</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tutor-Ward Meeting</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="bg-muted p-3 rounded-md mb-2">
                    <p className="text-sm font-medium">Creating Meeting For: <span className="text-primary">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span></p>
                 </div>
                 <div>
                    <Label>Meeting Type</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="END_SEM">End Semester</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label>Assign For Class</Label>
                    <Select value={formData.selectedClassIndex} onValueChange={v => setFormData({...formData, selectedClassIndex: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                        <SelectContent>
                            {assignedClasses.map((cls, idx) => (
                                <SelectItem key={idx} value={idx.toString()}>
                                    {cls.degree} Sem- {cls.semester} Sec- {cls.section} (Batch {cls.year})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {assignedClasses.length === 0 && <p className="text-xs text-red-500 mt-1">No students assigned to you yet.</p>}
                 </div>
                 <Button onClick={handleCreateMeeting}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Meetings List */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
           <div className="p-4 border-b"><h3 className="font-semibold">Your Meetings</h3></div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                 <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y">
                 {loading ? <tr><td colSpan={5} className="px-4 py-4 text-center">Loading...</td></tr> : 
                  meetings.length === 0 ? <tr><td colSpan={5} className="px-4 py-4 text-center">No meetings found</td></tr> :
                  meetings.map(meeting => (
                      <tr key={meeting._id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{meeting.month}/{meeting.year}</td>
                          <td className="px-4 py-3">{meeting.degree} {meeting.semester}-{meeting.section}</td>
                          <td className="px-4 py-3">{meeting.type}</td>
                          <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  meeting.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                  meeting.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>{meeting.status}</span>
                          </td>
                          <td className="px-4 py-3 space-x-2">
                             {(meeting.status === 'DRAFT' || meeting.status === 'CLOSED') && (
                                 <Button size="sm" variant="outline" onClick={() => handleWindowToggle(meeting, 'open')}>
                                     <Unlock className="w-4 h-4 mr-1" /> Open
                                 </Button>
                             )}
                             {meeting.status === 'OPEN' && (
                                 <Button size="sm" variant="destructive" onClick={() => handleWindowToggle(meeting, 'close')}>
                                     <Lock className="w-4 h-4 mr-1" /> Close
                                 </Button>
                             )}
                             <Button size="sm" onClick={() => handleViewQueries(meeting)}>
                                 View Queries
                             </Button>
                             {meeting.pdf_path && (
                                 <Button size="sm" variant="secondary" onClick={() => window.open(`http://localhost:5000/public${meeting.pdf_path}`, '_blank')}>
                                     <FileText className="w-4 h-4" /> PDF
                                 </Button>
                             )}
                          </td>
                      </tr>
                  ))
                 }
              </tbody>
             </table>
           </div>
        </div>

        {/* Selected Meeting Queries */}
        {selectedMeeting && (
            <div className="bg-card rounded-lg border shadow-sm mt-6 overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-muted/50">
                    <h3 className="font-semibold">Queries for {selectedMeeting.degree} {selectedMeeting.semester}-{selectedMeeting.section} ({selectedMeeting.month}/{selectedMeeting.year})</h3>
                    {selectedMeeting.status !== 'COMPLETED' && queries.every(q => q.status !== 'PENDING') && queries.length > 0 && (
                        <Button variant="default" onClick={() => handleGeneratePDF(selectedMeeting._id)}>
                            Generate PDF
                        </Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Review</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Remark</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {queriesLoading ? <tr><td colSpan={5} className="px-4 py-4 text-center">Loading...</td></tr> :
                         queries.length === 0 ? <tr><td colSpan={5} className="px-4 py-4 text-center">No queries submitted yet</td></tr> :
                         queries.map(q => (
                             <tr key={q._id} className="hover:bg-muted/50">
                                 <td className="px-4 py-3">
                                     <div className="font-medium">{q.student_id ? q.student_id.name : 'Unknown'}</div>
                                     <div className="text-xs text-muted-foreground">{q.student_id?.roll_number}</div>
                                 </td>
                                 <td className="px-4 py-3 max-w-xs truncate" title={q.concern}>{q.concern}</td>
                                 <td className="px-4 py-3">
                                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                         q.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                         q.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                         'bg-yellow-100 text-yellow-800'
                                     }`}>{q.status}</span>
                                 </td>
                                 <td className="px-4 py-3">{q.tutor_remark || '-'}</td>
                                 <td className="px-4 py-3">
                                     {q.status === 'PENDING' && selectedMeeting.status !== 'COMPLETED' && (
                                         <div className="flex gap-2">
                                             <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8" 
                                                onClick={() => { setSelectedQuery(q); setReviewAction('APPROVED'); setRemark(''); setReviewOpen(true); }}>
                                                 <CheckCircle className="w-5 h-5" />
                                             </Button>
                                             <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                onClick={() => { setSelectedQuery(q); setReviewAction('REJECTED'); setRemark(''); setReviewOpen(true); }}>
                                                 <XCircle className="w-5 h-5" />
                                             </Button>
                                         </div>
                                     )}
                                 </td>
                             </tr>
                         ))
                        }
                    </tbody>
                 </table>
                </div>
            </div>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Query</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Student: <span className="font-medium">{selectedQuery?.student_id?.name}</span>
                    </p>
                    <p className="text-sm bg-muted p-2 rounded">{selectedQuery?.concern}</p>
                    <div className="space-y-2">
                        <Label>Remark (Required)</Label>
                        <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Enter action taken or reason..." />
                    </div>
                    <Button onClick={handleReviewQuery} className="w-full" variant={reviewAction === 'APPROVED' ? 'default' : 'destructive'} disabled={!remark.trim()}>
                        Confirm {reviewAction === 'APPROVED' ? 'Approval' : 'Rejection'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

         {/* Query Logs Dialog */}
         <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Query Logs</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input className="pl-8" placeholder="Search by student or query..." value={logSearch} onChange={e => setLogSearch(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && fetchLogs()} />
                        </div>
                        <Select value={logStatus} onValueChange={setLogStatus}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Query Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={logMeetingStatus} onValueChange={setLogMeetingStatus}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Meeting Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Meetings</SelectItem>
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchLogs}>Apply</Button>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Student</th>
                                    <th className="px-4 py-2">Class</th>
                                    <th className="px-4 py-2">Query</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logLoading ? <tr><td colSpan={6} className="px-4 py-4 text-center">Loading...</td></tr> :
                                 logQueries.length === 0 ? <tr><td colSpan={6} className="px-4 py-4 text-center">No logs found</td></tr> :
                                 logQueries.map(q => (
                                     <tr key={q._id}>
                                         <td className="px-4 py-2">{q.meeting_id ? `${q.meeting_id.month}/${q.meeting_id.year}` : '-'}</td>
                                         <td className="px-4 py-2">
                                             <div className="font-medium">{q.student_id?.name}</div>
                                             <div className="text-xs text-muted-foreground">{q.student_id?.roll_number}</div>
                                         </td>
                                         <td className="px-4 py-2 text-xs">
                                             {q.meeting_id ? `${q.meeting_id.degree} ${q.meeting_id.semester}-${q.meeting_id.section}` : '-'}
                                         </td>
                                         <td className="px-4 py-2"><div className="max-w-xs truncate" title={q.concern}>{q.concern}</div></td>
                                         <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                q.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                q.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>{q.status}</span>
                                         </td>
                                         <td className="px-4 py-2">{q.tutor_remark || '-'}</td>
                                     </tr>
                                 ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
