import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, FileText, Lock, Unlock, CheckCircle, XCircle, Search, Filter, History, Users, MessageSquare, Calendar } from 'lucide-react';

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
    subject: string;
    concern: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    tutor_remark?: string;
    meeting_id?: Meeting;
    created_at: string;
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
    const [logQueries, setLogQueries] = useState<Query[]>([]);
    const [logSearch, setLogSearch] = useState('');
    const [logStatus, setLogStatus] = useState<string>('ALL');
    const [logMeetingStatus, setLogMeetingStatus] = useState<string>('ALL');
    const [logLoading, setLogLoading] = useState(false);

    useEffect(() => {
        fetchMeetings();
        fetchAssignedClasses();
        fetchLogs(); // Load initial logs for side panel
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
        } catch (e) {
            // Silent fail for logs on init
        }
        finally { setLogLoading(false); }
    };

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
            // Update local state if selected
            if (selectedMeeting?._id === meeting._id) {
                const updated = { ...selectedMeeting, status: action === 'open' ? 'OPEN' : 'CLOSED' } as Meeting;
                setSelectedMeeting(updated);
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

            // Refresh queries for selected meeting
            if (selectedMeeting) {
                handleViewQueries(selectedMeeting);
            }
            // Refresh logs
            fetchLogs();
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

    // Stats
    const activeMeetings = meetings.filter(m => m.status === 'OPEN').length;
    const pendingQueriesCount = logQueries.filter(q => q.status === 'PENDING').length;

    return (
        <DashboardLayout title="Faculty Dashboard" subtitle={`Welcome, ${user?.name}!`} showBackToHod={user?.role === 'hod'}>
            <div className="space-y-6">

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">My Classes</p>
                                <h2 className="text-2xl font-bold">{assignedClasses.length}</h2>
                            </div>
                            <Users className="h-8 w-8 text-blue-500 opacity-50" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Meetings</p>
                                <h2 className="text-2xl font-bold text-green-600">{activeMeetings}</h2>
                            </div>
                            <Calendar className="h-8 w-8 text-green-500 opacity-50" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Queries</p>
                                <h2 className="text-2xl font-bold text-yellow-600">{pendingQueriesCount}</h2>
                            </div>
                            <MessageSquare className="h-8 w-8 text-yellow-500 opacity-50" />
                        </CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => setIsCreateOpen(true)}>
                        <CardContent className="p-4 flex items-center justify-center h-full">
                            <div className="flex items-center gap-2 font-semibold">
                                <Plus className="h-5 w-5" /> Create Meeting
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Column: Meetings List */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="min-h-[500px]">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>My Meetings</CardTitle>
                                    <CardDescription>Manage your tutor-ward meetings and reports</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? <div className="text-center py-8">Loading...</div> :
                                    meetings.length === 0 ? <div className="text-center py-8 text-muted-foreground">No meetings found. Create one to get started.</div> :
                                        <div className="space-y-4">
                                            {meetings.map(meeting => (
                                                <div key={meeting._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                                    <div className="space-y-1 mb-3 sm:mb-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">{meeting.degree} {meeting.semester}-{meeting.section}</span>
                                                            <Badge variant={meeting.status === 'OPEN' ? 'default' : 'secondary'} className={meeting.status === 'OPEN' ? 'bg-green-600' : ''}>
                                                                {meeting.status}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded uppercase">{meeting.type}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">Date: {meeting.month}/{meeting.year}</p>
                                                    </div>
                                                    <div className="flex gap-2">
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
                                                        <Button size="sm" variant="secondary" onClick={() => handleViewQueries(meeting)}>
                                                            View Queries
                                                        </Button>
                                                        {meeting.pdf_path && (
                                                            <Button size="sm" variant="ghost" onClick={() => window.open(`http://localhost:5000/public${meeting.pdf_path}`, '_blank')}>
                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                }
                            </CardContent>
                        </Card>

                        {/* Selected Meeting Details View (Collapsible or Conditional) */}
                        {selectedMeeting && (
                            <Card className="border-t-4 border-t-primary animate-in fade-in slide-in-from-bottom-4">
                                <CardHeader className="flex flex-row items-center justify-between bg-muted/20">
                                    <div>
                                        <CardTitle className="text-lg"> Queries: {selectedMeeting.degree} {selectedMeeting.semester}-{selectedMeeting.section}</CardTitle>
                                        <CardDescription>{selectedMeeting.month}/{selectedMeeting.year}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedMeeting(null)}>Close View</Button>
                                        {selectedMeeting.status !== 'COMPLETED' && queries.length > 0 && queries.every(q => q.status !== 'PENDING') && (
                                            <Button variant="outline" size="sm" onClick={() => handleGeneratePDF(selectedMeeting._id)}>
                                                <FileText className="mr-2 h-4 w-4" /> Generate Report
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted text-muted-foreground">
                                                <tr>
                                                    <th className="px-4 py-3">Student</th>
                                                    <th className="px-4 py-3">Subject</th>
                                                    <th className="px-4 py-3">Concern</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {queriesLoading ? <tr><td colSpan={5} className="p-4 text-center">Loading queries...</td></tr> :
                                                    queries.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No queries submitted.</td></tr> :
                                                        queries.map(q => (
                                                            <tr key={q._id} className="hover:bg-muted/50">
                                                                <td className="px-4 py-3">
                                                                    <div className="font-medium">{q.student_id ? q.student_id.name : 'Unknown'}</div>
                                                                    <div className="text-xs text-muted-foreground">{q.student_id?.roll_number}</div>
                                                                </td>
                                                                <td className="px-4 py-3 font-medium">{q.subject}</td>
                                                                <td className="px-4 py-3 max-w-[200px] truncate" title={q.concern}>{q.concern}</td>
                                                                <td className="px-4 py-3">
                                                                    <Badge variant={q.status === 'APPROVED' ? 'default' : q.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                                                        {q.status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {q.status === 'PENDING' && selectedMeeting.status !== 'COMPLETED' ? (
                                                                        <div className="flex gap-1">
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100"
                                                                                onClick={() => { setSelectedQuery(q); setReviewAction('APPROVED'); setRemark(''); setReviewOpen(true); }}>
                                                                                <CheckCircle className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 bg-red-50 hover:bg-red-100"
                                                                                onClick={() => { setSelectedQuery(q); setReviewAction('REJECTED'); setRemark(''); setReviewOpen(true); }}>
                                                                                <XCircle className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : <span className="text-xs text-muted-foreground">{q.tutor_remark || '-'}</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Recent Logs & Filters */}
                    <div className="space-y-6">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Recent Activity</CardTitle>
                            </CardHeader>
                            <div className="p-4 space-y-3 bg-muted/20">
                                <Input placeholder="Search queries..." value={logSearch} onChange={e => { setLogSearch(e.target.value); fetchLogs(); }} className="bg-background" />
                                <div className="flex gap-2">
                                    <Select value={logStatus} onValueChange={v => { setLogStatus(v); }} onOpenChange={() => fetchLogs()}>
                                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Status</SelectItem>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="APPROVED">Approved</SelectItem>
                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="icon" variant="outline" onClick={fetchLogs}><Search className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto max-h-[600px] p-0">
                                {logLoading ? <div className="p-4 text-center">Loading...</div> :
                                    logQueries.length === 0 ? <div className="p-4 text-center text-muted-foreground text-sm">No recent queries found.</div> :
                                        <div className="divide-y">
                                            {logQueries.map(log => (
                                                <div key={log._id} className="p-4 hover:bg-muted/50 text-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="font-semibold">{log.student_id?.name}</div>
                                                        <Badge variant="outline" className="text-[10px] h-5">{log.status}</Badge>
                                                    </div>
                                                    <p className="font-medium text-xs text-primary mb-1">{log.subject}</p>
                                                    <p className="text-muted-foreground line-clamp-2 text-xs mb-2">{log.concern}</p>
                                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                                        <span>{log.meeting_id ? `${log.meeting_id.degree} ${log.meeting_id.semester}-${log.meeting_id.section}` : 'N/A'}</span>
                                                        <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                }
                            </div>
                        </Card>
                    </div>

                </div>

                {/* Dialogs */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Meeting</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="bg-muted p-3 rounded-md mb-2">
                                <p className="text-sm font-medium">For: <span className="text-primary">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span></p>
                            </div>
                            <div>
                                <Label>Meeting Type</Label>
                                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="END_SEM">End Semester</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Assign For Class</Label>
                                {assignedClasses.length > 0 ? (
                                    <Select value={formData.selectedClassIndex} onValueChange={v => setFormData({ ...formData, selectedClassIndex: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>
                                            {assignedClasses.map((cls, idx) => (
                                                <SelectItem key={idx} value={idx.toString()}>
                                                    {cls.degree} Sem-{cls.semester} ({cls.section})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : <p className="text-sm text-red-500">No classes assigned to you.</p>}
                            </div>
                            <Button onClick={handleCreateMeeting} disabled={assignedClasses.length === 0}>Create Meeting</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Query</DialogTitle></DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <p><span className="font-semibold">Subject:</span> {selectedQuery?.subject}</p>
                                <p className="mt-1"><span className="font-semibold">Concern:</span> {selectedQuery?.concern}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Tutor Advice / Remark (Required)</Label>
                                <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Type your response here..." />
                            </div>
                            <Button onClick={handleReviewQuery} className="w-full" disabled={!remark.trim()}
                                variant={reviewAction === 'APPROVED' ? 'default' : 'destructive'}>
                                Confirm Action
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default FacultyDashboard;
