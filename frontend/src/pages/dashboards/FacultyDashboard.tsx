import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

const FacultyDashboard = () => {
  const { user } = useAuth();

  const title = user?.role === 'hod' ? 'HOD View - Faculty Dashboard' : 'Faculty Dashboard';
  const subtitle = `Welcome, ${user?.name}!`;

  const additionalContent = (
    <div className="grid md:grid-cols-2 gap-4 mt-6 max-w-md mx-auto">
      <div className="data-box card-consistent">
        <p className="text-sm text-muted-foreground">Department</p>
        <p className="font-semibold">{user?.department}</p>
      </div>
      <div className="data-box card-consistent">
        <p className="text-sm text-muted-foreground">Designation</p>
        <p className="font-semibold">{user?.designation}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title={title}
      subtitle={subtitle}
      showBackToHod={true}
      additionalContent={additionalContent}
    >
      <div className="text-center">
        <p className="text-muted-foreground">
          Faculty dashboard content goes here
        </p>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
