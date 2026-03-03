import { useState } from 'react';
import { useComplaints } from '@/contexts/ComplaintContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ccm/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CCMFacultyTab = () => {
    const { complaints, updateComplaintStatus } = useComplaints();
    const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
    const [remarks, setRemarks] = useState('');
    const [actionType, setActionType] = useState<'resolve' | 'reject' | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | string>('ALL');

    // Faculty only sees complaints assigned to them (Backend filters this usually, but safety check)
    // AND they act on 'Approved' (if workflow enforces Coordinator approval) OR 'Pending' if they are direct
    // CCM Workflow: Pending -> (Coordinator Appoves) -> Approved -> (Staff Resolves) -> Resolved
    // So Staff usually only sees 'Approved', 'Resolved', 'Rejected by Staff'.
    
    // However, if we don't have active Coordinators yet, we might want to allow Staff to see Pending.
    // For now, mirroring CCM Logic:
    const visibleComplaints = (complaints || []).filter(c =>
        ['Approved', 'Resolved', 'Rejected by Staff'].includes(c.status)
    );

    const filteredComplaints = visibleComplaints.filter(c => {
        return selectedStatus === 'ALL' || c.status === selectedStatus;
    });

    const stats = {
        total: visibleComplaints.filter(c => c.status === 'Approved').length, // Actionable
        resolved: visibleComplaints.filter(c => c.status === 'Resolved').length,
        rejected: visibleComplaints.filter(c => c.status === 'Rejected by Staff').length,
    };

    const handleResolve = (id: string) => {
        setSelectedComplaint(id);
        setActionType('resolve');
    };

    const handleReject = (id: string) => {
        setSelectedComplaint(id);
        setActionType('reject');
    };

    const handleConfirmAction = async () => {
        if (!selectedComplaint) return;
        if (!remarks.trim()) {
            toast.error('Please add remarks');
            return;
        }

        if (actionType === 'resolve') {
            await updateComplaintStatus(selectedComplaint, 'Resolved', remarks, 'staff');
        } else if (actionType === 'reject') {
            await updateComplaintStatus(selectedComplaint, 'Rejected by Staff', remarks, 'staff');
        }

        setSelectedComplaint(null);
        setRemarks('');
        setActionType(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <div className="w-64">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="Approved">Pending Action</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Rejected by Staff">Rejected by Me</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Action</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-yellow-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
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
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <span className="text-2xl font-bold text-foreground">{stats.rejected}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assigned Complaints</CardTitle>
                    <CardDescription>Manage student complaints assigned to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Year</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Student Remarks</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredComplaints.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No complaints found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredComplaints.map((complaint) => (
                                    <TableRow key={complaint.id}>
                                        <TableCell>Year {complaint.year}</TableCell>
                                        <TableCell>{complaint.subject}</TableCell>
                                        <TableCell>{complaint.type}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={complaint.status} />
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(complaint.timestamp, 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {complaint.status === 'Approved' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" onClick={() => handleResolve(complaint.id)}>
                                                        Resolve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleReject(complaint.id)}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'resolve' ? 'Resolve Complaint' : 'Reject Complaint'}
                        </DialogTitle>
                        <DialogDescription>
                            Add remarks explaining your decision.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks *</Label>
                            <Textarea
                                id="remarks"
                                placeholder="Enter your remarks..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                        <Button onClick={handleConfirmAction}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CCMFacultyTab;
