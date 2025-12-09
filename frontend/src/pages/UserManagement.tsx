import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, UserCheck, Edit, Trash2, Plus, GraduationCap, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

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
  created_at: string;
}

export const UserManagementContent = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    employeeId: '',
    year: '',
    designation: '',
    phone: ''
  });
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


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (roleFilter !== 'all') params.append('role', roleFilter);
        if (yearFilter !== 'all') params.append('year', yearFilter);


        const response = await fetch(`http://localhost:5000/api/users/search?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Transform snake_case to camelCase
          const transformedData = data.data.map((user: any) => ({
            ...user,
            rollNumber: user.roll_number || user.employee_id, // Students have roll_number, faculty have employee_id
            employeeId: user.employee_id,
            createdAt: user.created_at
          }));
          setUsers(transformedData);
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, roleFilter, yearFilter]);

  const getRoleIcon = (role: string) => {
    return role === 'student' ? <GraduationCap className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    return role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  // Modal handlers
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber || '',
      employeeId: user.employeeId || '',
      year: user.year || '',
      designation: user.designation || '',
      phone: user.phone || ''
    });
    setEditModalOpen(true);
  };

  const openAddModal = () => {
    setAddForm({
      role: 'student',
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
    setAddModalOpen(true);
  };

  // Form handlers
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: selectedUser.role,
          ...editForm
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Transform snake_case to camelCase
        const transformedUser = {
          ...updatedUser.data,
          rollNumber: updatedUser.data.roll_number,
          employeeId: updatedUser.data.employee_id,
          createdAt: updatedUser.data.created_at
        };
        setUsers(users.map(u => u.id === selectedUser.id ? transformedUser : u));
        setEditModalOpen(false);
      }
      } catch (error) {
        // Error handled silently
      }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Sending add form data:', addForm); // Debug log

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addForm)
      });

      if (response.ok) {
        const newUser = await response.json();
        const transformedUser = {
          ...newUser.data,
          rollNumber: newUser.data.roll_number,
          employeeId: newUser.data.employee_id,
          createdAt: newUser.data.created_at
        };
        setUsers([...users, transformedUser]);
        setAddModalOpen(false);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser.id}?role=${selectedUser.role}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setDeleteModalOpen(false);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  return (
      <div className="space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year (Students)</Label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="I">Year I</SelectItem>
                    <SelectItem value="II">Year II</SelectItem>
                    <SelectItem value="III">Year III</SelectItem>
                    <SelectItem value="IV">Year IV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card key="students-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="faculty-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'faculty').length}</p>
                  <p className="text-sm text-muted-foreground">Faculty</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card key="total-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Plus className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Users ({users.length})</span>
              <Button className="button-hover" onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={`${user.role}-${user.id}`} className="flex items-center justify-between p-4 border rounded-lg card-hover">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          {user.role === 'student' && user.year && (
                            <Badge variant="outline">Year {user.year}</Badge>
                          )}
                          <Badge variant="outline">{user.department}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="py-6">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold">{selectedUser.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                    <Badge variant="outline">{selectedUser.department}</Badge>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    className="flex-1"
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and save changes.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="py-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>

              {selectedUser?.role === 'student' && (
                <div>
                  <Label htmlFor="edit-rollNumber">Roll Number</Label>
                  <Input
                    id="edit-rollNumber"
                    value={editForm.rollNumber}
                    onChange={(e) => setEditForm({...editForm, rollNumber: e.target.value})}
                  />
                </div>
              )}

              {selectedUser?.role === 'student' && (
                <div>
                  <Label htmlFor="edit-year">Year</Label>
                  <Select value={editForm.year} onValueChange={(value) => setEditForm({...editForm, year: value})}>
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

              {selectedUser?.role === 'faculty' && (
                <>
                  <div>
                    <Label htmlFor="edit-employeeId">Employee ID</Label>
                    <Input
                      id="edit-employeeId"
                      value={editForm.employeeId}
                      onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-designation">Designation</Label>
                    <Input
                      id="edit-designation"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
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

        {/* Add User Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new student or faculty account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="py-6 space-y-4">
              <div>
                <Label htmlFor="add-role">Role</Label>
                <Select value={addForm.role} onValueChange={(value: 'student' | 'faculty') => setAddForm({...addForm, role: value})}>
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
                  onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="add-password">Password</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                />
              </div>

              {addForm.role === 'student' && (
                <>
                  <div>
                    <Label htmlFor="add-rollNumber">Roll Number</Label>
                    <Input
                      id="add-rollNumber"
                      value={addForm.rollNumber}
                      onChange={(e) => setAddForm({...addForm, rollNumber: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="add-year">Year</Label>
                    <Select value={addForm.year} onValueChange={(value) => setAddForm({...addForm, year: value})}>
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
                      onChange={(e) => setAddForm({...addForm, employeeId: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="add-designation">Designation</Label>
                    <Input
                      id="add-designation"
                      value={addForm.designation}
                      onChange={(e) => setAddForm({...addForm, designation: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
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
      </div>
  );
};

const UserManagement = () => {
  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage all students and faculty accounts"
      showBackToHod={true}
    >
      <UserManagementContent />
    </DashboardLayout>
  );
};

export default UserManagement;
