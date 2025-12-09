import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Users, UserCheck, Plus, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import UserList from '@/components/admin/UserList';
import AddUserDialog from '@/components/admin/AddUserDialog';
import EditUserDialog from '@/components/admin/EditUserDialog';

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

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, yearFilter]);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const openAddModal = () => {
    setAddModalOpen(true);
  };

  // Action handlers
  const handleEditSubmit = async (id: string, formData: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
        setUsers(users.map(u => u.id === id ? transformedUser : u));
        setEditModalOpen(false);
      }
      } catch (error) {
        console.error(error);
      }
  };

  const handleAddSubmit = async (formData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
      console.error(error);
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
      console.error(error);
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
        <UserList 
          users={users} 
          loading={loading} 
          onEdit={openEditModal} 
          onDelete={openDeleteModal} 
          onAdd={openAddModal} 
        />

        {/* Modals */}
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

        <AddUserDialog 
          open={addModalOpen} 
          onOpenChange={setAddModalOpen} 
          onAdd={handleAddSubmit} 
        />

        <EditUserDialog 
          open={editModalOpen} 
          onOpenChange={setEditModalOpen} 
          user={selectedUser} 
          onEdit={handleEditSubmit} 
        />
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
