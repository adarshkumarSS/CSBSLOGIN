import { useState } from 'react';
import { useComplaints, ComplaintStatus } from '@/contexts/ComplaintContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ccm/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const CCMAdminTab = () => {
  const { complaints } = useComplaints();
  const [selectedYear, setSelectedYear] = useState<string | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | 'ALL'>('ALL');

  const yearFilteredComplaints = (complaints || []).filter(complaint => {
    return selectedYear === 'ALL' || complaint.year === selectedYear;
  });

  const filteredComplaints = yearFilteredComplaints.filter(complaint => {
    return selectedStatus === 'ALL' || complaint.status === selectedStatus;
  });

  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter(c => c.status === 'Pending').length,
    approved: filteredComplaints.filter(c => c.status === 'Approved').length,
    resolved: filteredComplaints.filter(c => c.status === 'Resolved').length,
  };

  return (
    <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by Year</Label>
                <Select value={selectedYear} onValueChange={(value) => setSelectedYear(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Years</SelectItem>
                    <SelectItem value="I">Year I</SelectItem>
                    <SelectItem value="II">Year II</SelectItem>
                    <SelectItem value="III">Year III</SelectItem>
                    <SelectItem value="IV">Year IV</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Filter by Status</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ComplaintStatus | 'ALL')}>
                  <SelectTrigger>
                    <SelectValue />
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
        </div>

      {/* Stats */}
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

      <Card>
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>
            Overview of all complaints
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg. No.</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No complaints found matching the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.registerNumber}</TableCell>
                      <TableCell>{complaint.year}</TableCell>
                      <TableCell>{complaint.studentName}</TableCell>
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

export default CCMAdminTab;
