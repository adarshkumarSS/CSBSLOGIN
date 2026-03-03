import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AddUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (formData: any) => Promise<void>;
}

const AddUserDialog = ({ open, onOpenChange, onAdd }: AddUserDialogProps) => {
    const [addForm, setAddForm] = useState({
        role: 'student' as 'student' | 'faculty',
        name: '',
        email: '',
        password: '',
        rollNumber: '',
        employeeId: '',
        year: '',
        department: 'Computer Science and Business Systems',
        designation: '',
        phone: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAdd(addForm);
        // Reset form optionally or keep it? Parent handles closing.
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new student or faculty account.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="py-6 space-y-4">
                    <div>
                        <Label htmlFor="add-role">Role</Label>
                        <Select value={addForm.role} onValueChange={(value: 'student' | 'faculty') => setAddForm({ ...addForm, role: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="faculty">Faculty</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="add-name">Name</Label>
                        <Input
                            id="add-name"
                            value={addForm.name}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="add-email">Email</Label>
                        <Input
                            id="add-email"
                            type="email"
                            value={addForm.email}
                            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="add-password">Password</Label>
                        <Input
                            id="add-password"
                            type="password"
                            value={addForm.password}
                            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="add-phone">Phone</Label>
                        <Input
                            id="add-phone"
                            value={addForm.phone}
                            onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        />
                    </div>

                    {addForm.role === 'student' && (
                        <>
                            <div>
                                <Label htmlFor="add-rollNumber">Roll Number</Label>
                                <Input
                                    id="add-rollNumber"
                                    value={addForm.rollNumber}
                                    onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="add-year">Year</Label>
                                <Select value={addForm.year} onValueChange={(value) => setAddForm({ ...addForm, year: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="I">Year I</SelectItem>
                                        <SelectItem value="II">Year II</SelectItem>
                                        <SelectItem value="III">Year III</SelectItem>
                                        <SelectItem value="IV">Year IV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {addForm.role === 'faculty' && (
                        <>
                            <div>
                                <Label htmlFor="add-employeeId">Employee ID</Label>
                                <Input
                                    id="add-employeeId"
                                    value={addForm.employeeId}
                                    onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="add-designation">Designation</Label>
                                <Input
                                    id="add-designation"
                                    value={addForm.designation}
                                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Add User
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddUserDialog;
