import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CustomQuestion {
    id: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox';
    question: string;
    options: string[];
    required: boolean;
    conditional: { enabled: boolean; dependsOn?: string; value?: string };
}

interface MeetingResponseFormProps {
    questions: CustomQuestion[];
    answers: { questionId: string, answer: any }[];
    onAnswerChange: (qId: string, val: any) => void;
    onSubmit: () => void;
}

const MeetingResponseForm = ({ questions, answers, onAnswerChange, onSubmit }: MeetingResponseFormProps) => {

    const handleSubmit = () => {
        // Client-side validation
        for (const q of questions) {
            if (q.required) {
                if (q.conditional.enabled) {
                    const parentAns = answers.find(a => a.questionId === q.conditional.dependsOn)?.answer;
                    if (parentAns !== q.conditional.value) continue;
                }
                const ans = answers.find(a => a.questionId === q.id)?.answer;
                if (!ans || (Array.isArray(ans) && ans.length === 0)) {
                    toast.error(`Please answer: ${q.question}`);
                    return;
                }
            }
        }
        onSubmit();
    };

    return (
        <Card className="border-l-4 border-l-purple-500 shadow-md">
            <CardHeader>
                <CardTitle>Mandatory Meeting Form</CardTitle>
                <CardDescription>Please answer the following questions required by your tutor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {questions.map((q) => {
                     // Check visibility
                     if (q.conditional.enabled) {
                         const parentAns = answers.find(a => a.questionId === q.conditional.dependsOn)?.answer;
                         if (parentAns !== q.conditional.value) return null;
                     }

                     return (
                        <div key={q.id} className="space-y-2">
                            <Label>{q.question} {q.required && <span className="text-red-500">*</span>}</Label>
                            {q.type === 'text' && <Input value={answers.find(a=>a.questionId===q.id)?.answer || ''} onChange={e => onAnswerChange(q.id, e.target.value)} />}
                            {q.type === 'textarea' && <Textarea value={answers.find(a=>a.questionId===q.id)?.answer || ''} onChange={e => onAnswerChange(q.id, e.target.value)} />}
                            {q.type === 'radio' && (
                                <div className="flex gap-4 flex-wrap">
                                    {q.options.map(opt => (
                                        <div key={opt} className="flex items-center space-x-2">
                                            <input type="radio" name={q.id} id={`${q.id}-${opt}`} value={opt} 
                                                checked={answers.find(a=>a.questionId===q.id)?.answer === opt}
                                                onChange={e => onAnswerChange(q.id, e.target.value)}
                                            />
                                            <label htmlFor={`${q.id}-${opt}`}>{opt}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {q.type === 'checkbox' && (
                                 <div className="flex gap-4 flex-wrap">
                                    {q.options.map(opt => (
                                        <div key={opt} className="flex items-center space-x-2">
                                            <input type="checkbox" id={`${q.id}-${opt}`} value={opt}
                                                 onChange={e => {
                                                     const current = (answers.find(a=>a.questionId===q.id)?.answer || []) as string[];
                                                     const newVal = e.target.checked ? [...current, opt] : current.filter(x => x !== opt);
                                                     onAnswerChange(q.id, newVal);
                                                 }}
                                                 checked={((answers.find(a=>a.questionId===q.id)?.answer || []) as string[]).includes(opt)}
                                            />
                                            <label htmlFor={`${q.id}-${opt}`}>{opt}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                     );
                })}
                <Button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700">Submit Form</Button>
            </CardContent>
        </Card>
    );
};

export default MeetingResponseForm;
