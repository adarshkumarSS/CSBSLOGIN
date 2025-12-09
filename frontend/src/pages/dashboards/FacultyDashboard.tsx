import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, XCircle, Search, History, Users, MessageSquare, Calendar, CheckCircle, FileText } from 'lucide-react';
import MeetingList from '@/components/meetings/MeetingList';
import CreateMeetingDialog from '@/components/meetings/CreateMeetingDialog';
import CourseList from '@/components/faculty/CourseList';
import RecentActivity from '@/components/faculty/RecentActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    // Create Meeting Form State - Handled by CreateMeetingDialog, simplified here
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Review State (restored)
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

    useEffect(() => {
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

    const handleCreateMeeting = async (payload: any) => {
        try {
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

    // View Responses Logic
    const [isResponseOpen, setIsResponseOpen] = useState(false);
    const [meetingResponses, setMeetingResponses] = useState<any[]>([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [selectedMeetingResponse, setSelectedMeetingResponse] = useState<any>(null); // To store meeting details for dialog

    const handleViewResponses = async (meeting: any) => {
        setSelectedMeetingResponse(meeting);
        setIsResponseOpen(true);
        setResponsesLoading(true);
        try {
             const res = await api.get(`/meetings/${meeting._id}/responses`);
             setMeetingResponses(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch responses');
        } finally {
            setResponsesLoading(false);
        }
    };

    // Stats
    const activeMeetings = meetings.filter(m => m.status === 'OPEN').length;
    const pendingQueriesCount = logQueries.filter(q => q.status === 'PENDING').length;


    const isTutor = assignedClasses.length > 0;

    return (
        <DashboardLayout title="Faculty Dashboard" subtitle={`Welcome, ${user?.name}!`} showBackToHod={user?.role === 'hod'}>
            <div className="space-y-6">
                <Tabs defaultValue="courses" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="courses">My Subjects</TabsTrigger>
                    {isTutor && <TabsTrigger value="mentorship">Mentorship Dashboard</TabsTrigger>}
                </TabsList>

                <TabsContent value="courses" className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <CourseList 
                            courses={courses}
                            onAdd={() => setIsCourseOpen(true)}
                            onDelete={handleDeleteCourse}
                         />
                    </div>
                </TabsContent>

                {isTutor && (
                    <TabsContent value="mentorship" className="space-y-6">
                        {/* Stats Cards */}
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
                                <MeetingList 
                                    meetings={meetings}
                                    loading={loading}
                                    onToggleWindow={handleWindowToggle}
                                    onViewQueries={handleViewQueries}
                                    onViewResponses={handleViewResponses}
                                />

                                {/* Selected Meeting Details View */}
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
                                <RecentActivity 
                                    logs={logQueries}
                                    loading={logLoading}
                                    search={logSearch}
                                    onSearchChange={(val) => { setLogSearch(val); fetchLogs(); }}
                                    statusFilter={logStatus}
                                    onStatusChange={(val) => { setLogStatus(val); fetchLogs(); }}
                                    onRefresh={fetchLogs}
                                />
                            </div>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

                {/* Dialogs */}
                <CreateMeetingDialog 
                    open={isCreateOpen} 
                    onOpenChange={setIsCreateOpen} 
                    assignedClasses={assignedClasses} 
                    onCreate={handleCreateMeeting} 
                />

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

                {/* View Responses Dialog */}
                <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Student Responses</DialogTitle>
                            <DialogDescription>
                                {selectedMeetingResponse?.degree} {selectedMeetingResponse?.semester}-{selectedMeetingResponse?.section}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4">
                            {responsesLoading ? (
                                <div className="text-center py-4">Loading responses...</div>
                            ) : meetingResponses.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">No responses submitted yet.</div>
                            ) : (
                                <div className="overflow-x-auto border rounded-md">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-2 border-b whitespace-nowrap">Student</th>
                                                {selectedMeetingResponse?.custom_questions?.map((q: any) => (
                                                    <th key={q.id} className="px-4 py-2 border-b min-w-[150px]">{q.question}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {meetingResponses.map((response: any) => (
                                                <tr key={response._id} className="hover:bg-muted/50">
                                                    <td className="px-4 py-2 border-r bg-muted/10 font-medium">
                                                        {response.student_id?.name || 'Unknown'}
                                                        <div className="text-xs text-muted-foreground">{response.student_id?.roll_number}</div>
                                                    </td>
                                                    {selectedMeetingResponse?.custom_questions?.map((q: any) => {
                                                        const ans = response.answers.find((a: any) => a.questionId === q.id);
                                                        return (
                                                            <td key={q.id} className="px-4 py-2 border-r last:border-r-0">
                                                                {ans ? ans.answer : <span className="text-muted-foreground">-</span>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </DashboardLayout>
    );
};

export default FacultyDashboard;
