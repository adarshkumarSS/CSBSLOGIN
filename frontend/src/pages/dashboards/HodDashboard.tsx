import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, UserCheck, BarChart3, Settings, FileText, Calendar, Award } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const HodDashboard = () => {
  const { user } = useAuth();

  const title = "HOD Dashboard";

  return (
    <DashboardLayout
      title={title}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Row 1 */}
        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Student Dashboard</h3>
          </div>
          <p className="text-muted-foreground mb-4">View student information and management</p>
          <Button asChild className="w-full button-hover">
            <Link to="/student/dashboard">Access Student Dashboard</Link>
          </Button>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <UserCheck className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Faculty Dashboard</h3>
          </div>
          <p className="text-muted-foreground mb-4">View faculty information and management</p>
          <Button asChild variant="outline" className="w-full button-hover">
            <Link to="/faculty/dashboard">Access Faculty Dashboard</Link>
          </Button>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">User Management</h3>
          </div>
          <p className="text-muted-foreground mb-4">Manage all students and faculty accounts</p>
          <Button asChild className="w-full button-hover">
            <Link to="/hod/user-management">Manage Users</Link>
          </Button>
        </div>

        {/* Row 2 */}
        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Department Overview</h3>
          </div>
          <p className="text-muted-foreground mb-4">Department analytics and administration</p>
          <Button variant="secondary" className="w-full button-hover" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Reports</h3>
          </div>
          <p className="text-muted-foreground mb-4">Generate department reports and statistics</p>
          <Button variant="secondary" className="w-full button-hover" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Schedule</h3>
          </div>
          <p className="text-muted-foreground mb-4">Manage department schedules and events</p>
          <Button variant="secondary" className="w-full button-hover" disabled>
            Coming Soon
          </Button>
        </div>

        {/* Row 3 */}
        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Achievements</h3>
          </div>
          <p className="text-muted-foreground mb-4">Track student and faculty achievements</p>
          <Button variant="secondary" className="w-full button-hover" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Settings</h3>
          </div>
          <p className="text-muted-foreground mb-4">Department settings and configurations</p>
          <Button variant="secondary" className="w-full button-hover" disabled>
            Coming Soon
          </Button>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm card-hover red-glow">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-6 w-6 text-red-500 icon-hover" />
            <h3 className="text-xl font-semibold">Announcements</h3>
          </div>
          <p className="text-muted-foreground mb-4">Create and manage department announcements</p>
          <Button variant="secondary" className="w-full button-hover" disabled>
            Coming Soon
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HodDashboard;
