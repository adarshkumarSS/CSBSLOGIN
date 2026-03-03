import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Plus, Users, UserCheck, GraduationCap } from 'lucide-react';

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

interface UserListProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAdd: () => void;
}

const UserList = ({ users, loading, onEdit, onDelete, onAdd }: UserListProps) => {
  const getRoleIcon = (role: string) => {
    return role === 'student' ? <GraduationCap className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    return role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Users ({users.length})</span>
          <Button className="button-hover" onClick={onAdd}>
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
              <div key={`${user.role}-${user.id}`} className="flex items-center justify-between p-4 border rounded-lg card-hover hover:shadow-md transition-all">
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
                  <Button variant="outline" size="sm" onClick={() => onEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(user)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
  );
};

export default UserList;
