import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, FileText } from 'lucide-react';

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

interface MeetingListProps {
    meetings: Meeting[];
    loading: boolean;
    onToggleWindow: (meeting: Meeting, action: 'open' | 'close') => void;
    onViewQueries: (meeting: Meeting) => void;
    onViewResponses?: (meeting: Meeting) => void;
}

const MeetingList = ({ meetings, loading, onToggleWindow, onViewQueries, onViewResponses }: MeetingListProps) => {
    return (
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
                                            <Button size="sm" variant="outline" onClick={() => onToggleWindow(meeting, 'open')}>
                                                <Unlock className="w-4 h-4 mr-1" /> Open
                                            </Button>
                                        )}
                                        {meeting.status === 'OPEN' && (
                                            <Button size="sm" variant="destructive" onClick={() => onToggleWindow(meeting, 'close')}>
                                                <Lock className="w-4 h-4 mr-1" /> Close
                                            </Button>
                                        )}
                                        <Button size="sm" variant="secondary" onClick={() => onViewQueries(meeting)}>
                                            View Queries
                                        </Button>
                                        {onViewResponses && (
                                            <Button size="sm" variant="outline" onClick={() => onViewResponses(meeting)}>
                                                Responses
                                            </Button>
                                        )}
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
    );
};

export default MeetingList;
