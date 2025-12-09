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

interface Course {
    _id: string;
    subject_name: string;
    subject_code: string;
    degree: string;
    department: string;
    year: string;
    semester: number;
    section: string;
    academic_year: string;
}

interface CustomQuestion {
    id: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox';
    question: string;
    options: string[];
    required: boolean;
    conditional: { enabled: boolean; dependsOn?: string; value?: string };
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

    // Course Mapping State
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCourseOpen, setIsCourseOpen] = useState(false);
    const [courseData, setCourseData] = useState({
        subject_name: '',
        subject_code: '',
        degree: 'B.Tech',
        department: 'Computer Science and Business Systems',
        year: 'I',
        semester: 1,
        section: 'A',
        academic_year: '2025-2026'
    });

    // Custom Questions State
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    const [qType, setQType] = useState<'text' | 'textarea' | 'radio' | 'checkbox'>('text');
    const [qText, setQText] = useState('');
    const [qOptions, setQOptions] = useState(''); // Comma separated
    const [qRequired, setQRequired] = useState(true);
    const [qConditional, setQConditional] = useState({ enabled: false, dependsOn: '', value: '' });

    const addQuestion = () => {
        if (!qText.trim()) { toast.error("Question text required"); return; }
        const newQ: CustomQuestion = {
            id: Date.now().toString(),
            type: qType,
            question: qText,
            options: qOptions.split(',').map(o => o.trim()).filter(o => o),
            required: qRequired,
            conditional: qConditional.enabled ? qConditional : { enabled: false }
        };
        setCustomQuestions([...customQuestions, newQ]);
        // Reset form
        setQText('');
        setQOptions('');
        setQRequired(true);
        setQType('text');
        setQConditional({ enabled: false, dependsOn: '', value: '' });
    };

    const removeQuestion = (id: string) => {
        setCustomQuestions(customQuestions.filter(q => q.id !== id));
    };

    useEffect(() => {
        fetchMeetings();
        fetchAssignedClasses();
        fetchLogs(); // Load initial logs for side panel
        fetchMeetings();
        fetchAssignedClasses();
        fetchLogs(); // Load initial logs for side panel
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            setCourses(res.data.data);
        } catch (error) {
            console.error(error);
            // toast.error('Failed to fetch courses');
        }
    };

    const handleAddCourse = async () => {
        if (!courseData.subject_name || !courseData.section) {
            toast.error("Subject and Section are required");
            return;
        }
        try {
            await api.post('/courses', courseData);
            toast.success('Course added successfully');
            setIsCourseOpen(false);
            fetchCourses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add course');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Are you sure you want to delete this course mapping?')) return;
        try {
            await api.delete(`/courses/${id}`);
            toast.success('Course deleted');
            fetchCourses();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete course');
        }
    };

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
                section: cls.section,
                custom_questions: customQuestions
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">My Courses (Subject Allocation)</CardTitle>
                            <Button size="sm" onClick={() => setIsCourseOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Subject</Button>
                        </CardHeader>
                        <CardContent>
                            {courses.length === 0 ? <p className="text-sm text-muted-foreground">No subjects allocated yet.</p> :
                                <div className="space-y-2">
                                    {courses.map(course => (
                                        <div key={course._id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                            <div>
                                                <p className="font-semibold">{course.subject_name} <span className="text-xs text-muted-foreground">({course.subject_code})</span></p>
                                                <p className="text-xs text-muted-foreground">{course.year} Year / Sem {course.semester} / Sec {course.section} ({course.degree})</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteCourse(course._id)}>
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            }
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
                            
                            {/* Question Builder */}
                            <div className="border-t pt-4">
                                <Label className="block mb-2 font-semibold">Custom Questions (Optional)</Label>
                                
                                <div className="space-y-3 mb-4 max-h-[200px] overflow-auto border p-2 rounded bg-muted/20">
                                    {customQuestions.length === 0 ? <p className="text-xs text-muted-foreground text-center">No custom questions added.</p> : 
                                        customQuestions.map((q, idx) => (
                                            <div key={q.id} className="flex justify-between items-start bg-background p-2 rounded border text-sm">
                                                <div>
                                                    <p className="font-medium">#{idx+1} {q.question} <span className="text-xs text-muted-foreground">({q.type})</span></p>
                                                    {q.options.length > 0 && <p className="text-xs text-muted-foreground">Options: {q.options.join(', ')}</p>}
                                                    {q.conditional.enabled && <p className="text-[10px] text-blue-600">If Q#{customQuestions.findIndex(x=>x.id===q.conditional.dependsOn)+1} = {q.conditional.value}</p>}
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeQuestion(q.id)}><XCircle className="h-4 w-4" /></Button>
                                            </div>
                                        ))
                                    }
                                </div>

                                <div className="space-y-2 border p-3 rounded bg-muted/50">
                                    <Label className="text-xs">Add New Question</Label>
                                    <Input value={qText} onChange={e => setQText(e.target.value)} placeholder="Question Text" className="h-8 text-sm" />
                                    <div className="flex gap-2">
                                        <Select value={qType} onValueChange={(v: any) => setQType(v)}>
                                            <SelectTrigger className="h-8 text-sm w-[120px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Short Text</SelectItem>
                                                <SelectItem value="textarea">Paragraph</SelectItem>
                                                <SelectItem value="radio">Radio Options</SelectItem>
                                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {(qType === 'radio' || qType === 'checkbox') && (
                                            <Input value={qOptions} onChange={e => setQOptions(e.target.value)} placeholder="Options (comma sep)" className="h-8 text-sm flex-1" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                         <div className="flex items-center space-x-2">
                                            <input type="checkbox" id="req" className="rounded border-gray-300" checked={qRequired} onChange={e => setQRequired(e.target.checked)} />
                                            <label htmlFor="req" className="text-sm">Mandatory</label>
                                        </div>
                                        {/* Simple Conditional Logic Toggle */}
                                        {customQuestions.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="cond" className="rounded border-gray-300" checked={qConditional.enabled} onChange={e => setQConditional({...qConditional, enabled: e.target.checked})} />
                                                <label htmlFor="cond" className="text-sm">Conditional</label>
                                            </div>
                                        )}
                                    </div>
                                    {qConditional.enabled && (
                                        <div className="flex gap-2 mt-2">
                                             <Select value={qConditional.dependsOn} onValueChange={v => setQConditional({...qConditional, dependsOn: v})}>
                                                <SelectTrigger className="h-8 text-sm w-[120px]"><SelectValue placeholder="Depends On" /></SelectTrigger>
                                                <SelectContent>
                                                    {customQuestions.map((q, i) => (
                                                        <SelectItem key={q.id} value={q.id}>Q#{i+1}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input value={qConditional.value} onChange={e => setQConditional({...qConditional, value: e.target.value})} placeholder="Value match" className="h-8 text-sm" />
                                        </div>
                                    )}
                                    <Button size="sm" variant="secondary" onClick={addQuestion} className="w-full mt-2">Add Question</Button>
                                </div>

                            </div>

                            <Button onClick={handleCreateMeeting} disabled={assignedClasses.length === 0}>Create Meeting</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Subject Allocation</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Academic Year</Label>
                                    <Input value={courseData.academic_year} onChange={e => setCourseData({ ...courseData, academic_year: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Degree</Label>
                                    <Input value={courseData.degree} onChange={e => setCourseData({ ...courseData, degree: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <Label>Subject Name</Label>
                                <Input value={courseData.subject_name} onChange={e => setCourseData({ ...courseData, subject_name: e.target.value })} placeholder="e.g. Data Structures" />
                            </div>
                            <div>
                                <Label>Subject Code (Optional)</Label>
                                <Input value={courseData.subject_code} onChange={e => setCourseData({ ...courseData, subject_code: e.target.value })} placeholder="e.g. CS123" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Year (I-IV)</Label>
                                    <Select value={courseData.year} onValueChange={v => setCourseData({ ...courseData, year: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="I">I</SelectItem>
                                            <SelectItem value="II">II</SelectItem>
                                            <SelectItem value="III">III</SelectItem>
                                            <SelectItem value="IV">IV</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Semester</Label>
                                    <Select value={courseData.semester.toString()} onValueChange={v => setCourseData({ ...courseData, semester: parseInt(v) })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Section</Label>
                                    <Select value={courseData.section} onValueChange={v => setCourseData({ ...courseData, section: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">A</SelectItem>
                                            <SelectItem value="B">B</SelectItem>
                                            <SelectItem value="C">C</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={handleAddCourse}>Add Course</Button>
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
