import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Send, User, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface Query {
    _id: string;
    subject: string;
    concern: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    tutor_remark?: string;
    created_at: string;
    meeting_id?: {
        type: string;
        month?: number;
        year?: number;
        status?: string;
        tutor_id?: { name: string };
    };
}

interface QueryHistoryListProps {
    queries: Query[];
    searchTerm: string;
    onEdit: (query: Query) => void;
}

const QueryHistoryList = ({ queries, searchTerm, onEdit }: QueryHistoryListProps) => {
    return (
        <div className="space-y-4">
            {queries.length === 0 ? (
                <Card className="bg-muted/30 border-dashed border-2 shadow-none">
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
                <div className="grid gap-4">
                    {queries.map(q => (
                        <Card key={q._id} className={`overflow-hidden transition-all hover:shadow-md border-l-4 group 
                            ${q.status === 'REJECTED' && q.meeting_id?.status === 'OPEN' 
                                ? 'border-l-red-500 bg-red-50/5 cursor-pointer' 
                                : q.status === 'APPROVED' ? 'border-l-green-500' : 'border-l-yellow-500'
                            }`}
                        >
                            <CardContent className="p-5">
                                <div className="flex flex-col md:flex-row gap-4 justify-between">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-lg leading-none group-hover:text-foreground/80 transition-colors">
                                                    {q.subject}
                                                </h3>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full tracking-wider">
                                                    {q.meeting_id?.type === 'MONTHLY' ? 'Monthly' : 'End Sem'}
                                                    {q.meeting_id?.month && ` • ${q.meeting_id.month}/${q.meeting_id.year}`}
                                                </span>
                                            </div>
                                            <div className="md:hidden">
                                                <StatusBadge status={q.status} />
                                            </div>
                                        </div>

                                        <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
                                            {q.concern}
                                        </p>

                                        {q.tutor_remark && (
                                            <div className="mt-3 text-sm bg-accent/10 p-3 rounded-md border border-accent/20 flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                                                <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent-foreground" />
                                                <span className="text-foreground/90 leading-snug">
                                                    <span className="font-semibold text-accent-foreground mr-1">Tutor:</span> 
                                                    {q.tutor_remark}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(q.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(q.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </div>

                                            {q.status === 'REJECTED' && q.meeting_id?.status === 'OPEN' && (
                                                <Button variant="link" size="sm" className="h-auto p-0 text-red-600 font-bold ml-auto md:ml-2 hover:underline" onClick={() => onEdit(q)}>
                                                    Requires Action: Edit & Resubmit
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hidden md:flex flex-col items-end gap-2 justify-center min-w-[120px] pl-4 border-l border-border/40">
                                        <StatusBadge status={q.status} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'APPROVED':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700 px-3 py-1"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approved</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive" className="px-3 py-1"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejected</Badge>;
        default:
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-3 py-1"><Clock className="w-3.5 h-3.5 mr-1.5" /> Pending</Badge>;
    }
}

export default QueryHistoryList;
