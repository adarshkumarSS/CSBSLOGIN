import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Send, User } from 'lucide-react';

interface Meeting {
    _id: string;
    month: number;
    year: number;
    type: string;
    tutor_id: { name: string };
}

interface QuerySubmissionFormProps {
    openMeetings: Meeting[];
    activeMeeting: Meeting | null;
    editingQueryId: string | null;
    subject: string;
    concern: string;
    onMeetingChange: (meetingId: string) => void;
    onSubjectChange: (val: string) => void;
    onConcernChange: (val: string) => void;
    onSubmit: () => void;
    onCancelEdit: () => void;
}

const QuerySubmissionForm = ({
    openMeetings,
    activeMeeting,
    editingQueryId,
    subject,
    concern,
    onMeetingChange,
    onSubjectChange,
    onConcernChange,
    onSubmit,
    onCancelEdit
}: QuerySubmissionFormProps) => {

    return (
        <Card className={`border-l-4 shadow-md ${editingQueryId ? 'border-l-orange-500' : 'border-l-primary'}`}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-xl">
                    {editingQueryId ? 'Edit Rejected Query' : 'Submit New Query'}
                </CardTitle>
                <CardDescription>
                    {editingQueryId ? 'Update your query for re-evaluation.' : 'Select an active meeting to submit your query.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {openMeetings.length > 0 || editingQueryId ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Meeting</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={activeMeeting?._id || ''}
                                disabled={!!editingQueryId}
                                onChange={e => onMeetingChange(e.target.value)}
                            >
                                {openMeetings.map(m => (
                                    <option key={m._id} value={m._id}>
                                        {m.type} - {m.month}/{m.year}
                                    </option>
                                ))}
                            </select>
                            {activeMeeting && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <User className="w-3 h-3" /> Tutor: {activeMeeting.tutor_id?.name}
                                </p>
                            )}
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={e => onSubjectChange(e.target.value)}
                                    placeholder="E.g., Hostel Maintenance, Academic Leave"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="concern">Concern Description</Label>
                                <Textarea
                                    id="concern"
                                    value={concern}
                                    onChange={e => onConcernChange(e.target.value)}
                                    placeholder="Please describe your query in detail..."
                                    className="min-h-[120px]"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={onSubmit} className="flex-1" disabled={!concern.trim() || !subject.trim()}>
                                    <Send className="w-4 h-4 mr-2" /> {editingQueryId ? 'Update Query' : 'Submit Query'}
                                </Button>
                                {editingQueryId && (
                                    <Button variant="outline" onClick={onCancelEdit}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>No active meetings available at this moment.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default QuerySubmissionForm;
