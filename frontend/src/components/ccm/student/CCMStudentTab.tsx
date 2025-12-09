import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useComplaints, ComplaintType } from '@/contexts/ComplaintContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ccm/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Clock, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CCMStudentTab = () => {
    const { user } = useAuth();
    const { complaints, addComplaint, subjectsAndStaff } = useComplaints();
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | string>('ALL');
    
    // New Complaint State
    const [isNewComplaintOpen, setIsNewComplaintOpen] = useState(false);
    const [newComplaintData, setNewComplaintData] = useState({
        subject: '',
        staffName: '',
        type: 'Academic' as ComplaintType,
        description: ''
    });

    // Filter complaints
    const studentUserYear = user?.year || 'I'; // Default or from user context
    const studentComplaints = (complaints || []).filter(c => {
        // In this integration, we might want to trust the backend to filter by studentID
        // But if filtering by year is strict:
        // const yearMatch = c.year === studentUserYear; 
        // return yearMatch && (selectedStatus === 'ALL' || c.status === selectedStatus);
        return selectedStatus === 'ALL' || c.status === selectedStatus;
    });

    const stats = {
        total: studentComplaints.length,
        pending: studentComplaints.filter(c => c.status === 'Pending').length,
        approved: studentComplaints.filter(c => c.status === 'Approved').length,
        resolved: studentComplaints.filter(c => c.status === 'Resolved').length,
    };

    // New Complaint Handlers
    const subjects = subjectsAndStaff[studentUserYear] || [];
    
    const handleSubjectChange = (subject: string) => {
        const staffMember = subjects.find(s => s.subject === subject);
        setNewComplaintData(prev => ({
            ...prev,
            subject,
            staffName: staffMember?.staff || ''
        }));
    };

    const handleSubmitComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        await addComplaint({
            ...newComplaintData,
            year: studentUserYear
        });
        setIsNewComplaintOpen(false);
        setNewComplaintData({ subject: '', staffName: '', type: 'Academic', description: '' });
    };

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.pending}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.approved}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.resolved}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions and Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                 <div className="w-full md:w-64">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Rejected by Coordinator">Rejected by Coordinator</SelectItem>
                            <SelectItem value="Rejected by Staff">Rejected by Staff</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Dialog open={isNewComplaintOpen} onOpenChange={setIsNewComplaintOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Complaint
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Complaint</DialogTitle>
                            <DialogDescription>Submit a new academic query or complaint.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitComplaint} className="space-y-4">
                             <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={newComplaintData.subject} onValueChange={handleSubjectChange} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {subjects.map((item) => (
                                        <SelectItem key={item.subject} value={item.subject}>
                                        {item.subject}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Staff Member</Label>
                                <Input value={newComplaintData.staffName} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={newComplaintData.type} onValueChange={(v) => setNewComplaintData(p => ({...p, type: v as ComplaintType}))} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Academic">Academic</SelectItem>
                                        <SelectItem value="Complaint">Complaint</SelectItem>
                                        <SelectItem value="Doubt">Doubt</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea 
                                    value={newComplaintData.description} 
                                    onChange={e => setNewComplaintData(p => ({...p, description: e.target.value}))}
                                    required 
                                    placeholder="Describe your issue..."
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Submit</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>My Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Staff</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentComplaints.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No complaints found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                studentComplaints.map((complaint) => (
                                    <TableRow key={complaint.id}>
                                        <TableCell>{complaint.subject}</TableCell>
                                        <TableCell>{complaint.staffName}</TableCell>
                                        <TableCell>{complaint.type}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={complaint.status} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(complaint.timestamp, 'MMM dd, yyyy')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default CCMStudentTab;
