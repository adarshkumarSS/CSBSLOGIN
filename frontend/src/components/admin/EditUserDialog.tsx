import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'faculty';
    rollNumber?: string;
    employeeId?: string;
    year?: string;
    department: string;
    designation?: string;
    phone?: string;
}

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    onEdit: (id: string, formData: any) => Promise<void>;
}

const EditUserDialog = ({ open, onOpenChange, user, onEdit }: EditUserDialogProps) => {
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        rollNumber: '',
        employeeId: '',
        year: '',
        designation: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setEditForm({
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber || '',
                employeeId: user.employeeId || '',
                year: user.year || '',
                designation: user.designation || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            await onEdit(user.id, { ...editForm, role: user.role });
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information and save changes.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="py-6 space-y-4">
                    <div>
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                            id="edit-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                            id="edit-phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                    </div>

                    {user.role === 'student' && (
                        <div>
                            <Label htmlFor="edit-rollNumber">Roll Number</Label>
                            <Input
                                id="edit-rollNumber"
                                value={editForm.rollNumber}
                                onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                            />
                        </div>
                    )}

                    {user.role === 'student' && (
                        <div>
                            <Label htmlFor="edit-year">Year</Label>
                            <Select value={editForm.year} onValueChange={(value) => setEditForm({ ...editForm, year: value })}>
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
                    )}

                    {user.role === 'faculty' && (
                        <>
                            <div>
                                <Label htmlFor="edit-employeeId">Employee ID</Label>
                                <Input
                                    id="edit-employeeId"
                                    value={editForm.employeeId}
                                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-designation">Designation</Label>
                                <Input
                                    id="edit-designation"
                                    value={editForm.designation}
                                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
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
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditUserDialog;
