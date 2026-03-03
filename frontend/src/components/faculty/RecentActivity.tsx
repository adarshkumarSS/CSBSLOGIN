import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Search, Clock, CheckCircle, XCircle } from "lucide-react";

interface Query {
    _id: string;
    student_id: { name: string; roll_number: string };
    subject: string;
    concern: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    tutor_remark?: string;
    meeting_id?: {
        degree: string;
        semester: number;
        section: string;
    };
    created_at: string;
}

interface RecentActivityProps {
    logs: Query[];
    loading: boolean;
    search: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    onRefresh: () => void;
}

const RecentActivity = ({ logs, loading, search, onSearchChange, statusFilter, onStatusChange, onRefresh }: RecentActivityProps) => {
    return (
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
            <CardHeader className="pb-3 border-b px-4 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-primary" /> Recent Activity
                </CardTitle>
            </CardHeader>
            
            <div className="p-4 space-y-3 bg-muted/20">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search queries..." 
                        value={search} 
                        onChange={e => onSearchChange(e.target.value)} 
                        className="pl-9 bg-background focus-visible:ring-primary/20" 
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="bg-background focus:ring-primary/20">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline" onClick={onRefresh} className="shrink-0 bg-background hover:bg-accent">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[600px] p-0 custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        Loading activity...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                         <History className="h-10 w-10 opacity-10 mb-2" />
                         No recent activity found.
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {logs.map(log => (
                            <div key={log._id} className="p-4 hover:bg-muted/30 transition-colors text-sm group">
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="font-semibold text-foreground">{log.student_id?.name || 'Unknown User'}</div>
                                    <StatusIcon status={log.status} />
                                </div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal tracking-wide bg-background/50">
                                        {log.subject}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(log.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-muted-foreground line-clamp-2 text-xs mb-2 leading-relaxed">
                                    "{log.concern}"
                                </p>
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                                    <span>
                                        {log.meeting_id ? 
                                            `${log.meeting_id.degree} ${log.meeting_id.semester}-${log.meeting_id.section}` : 
                                            'N/A'
                                        }
                                    </span>
                                    <span className={
                                        log.status === 'APPROVED' ? 'text-green-600' :
                                        log.status === 'REJECTED' ? 'text-red-600' : 
                                        'text-yellow-600'
                                    }>
                                        {log.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};

const StatusIcon = ({ status }: { status: string }) => {
    switch(status) {
        case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />;
        default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
}

export default RecentActivity;
