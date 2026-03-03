import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';

interface AssignedClass {
    degree: string;
    semester: number;
    section: string;
    year: string;
    studentCount: number;
}

interface CustomQuestion {
    id: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox';
    question: string;
    options: string[];
    required: boolean;
    conditional: { enabled: boolean; dependsOn?: string; value?: string };
}

interface CreateMeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignedClasses: AssignedClass[];
    onCreate: (payload: any) => Promise<void>;
}

const CreateMeetingDialog = ({ open, onOpenChange, assignedClasses, onCreate }: CreateMeetingDialogProps) => {
    const [formData, setFormData] = useState({
        type: 'MONTHLY',
        selectedClassIndex: ''
    });

    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    const [qType, setQType] = useState<'text' | 'textarea' | 'radio' | 'checkbox'>('text');
    const [qText, setQText] = useState('');
    const [qOptions, setQOptions] = useState('');
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
        setQText('');
        setQOptions('');
        setQRequired(true);
        setQType('text');
        setQConditional({ enabled: false, dependsOn: '', value: '' });
    };

    const removeQuestion = (id: string) => {
        setCustomQuestions(customQuestions.filter(q => q.id !== id));
    };

    const handleCreate = async () => {
        if (!formData.selectedClassIndex) {
            toast.error("Please select a class");
            return;
        }
        const cls = assignedClasses[parseInt(formData.selectedClassIndex)];
        const now = new Date();
        const payload = {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            type: formData.type,
            degree: cls.degree,
            semester: cls.semester,
            section: cls.section,
            custom_questions: customQuestions
        };
        await onCreate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create Meeting</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="bg-muted p-3 rounded-md mb-2">
                        <p className="text-sm font-medium">For: <span className="text-primary">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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

                    <Button onClick={handleCreate} disabled={assignedClasses.length === 0}>Create Meeting</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateMeetingDialog;
