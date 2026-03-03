import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ComplaintProvider } from "./contexts/ComplaintContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import SelectYear from "./pages/SelectYear";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import FacultyDashboard from "./pages/dashboards/FacultyDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import UserManagement from "./pages/UserManagement";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string | string[] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole) {
    const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const getDashboardPath = (role: string) => {
    if (role === 'hod' || role === 'admin') return '/admin/dashboard';
    return `/${role}/dashboard`;
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student Routes */}
      <Route path="/student/select-year" element={
        <ProtectedRoute allowedRole="student">
          <SelectYear />
        </ProtectedRoute>
      } />
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRole={['student', 'hod']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      {/* Faculty Routes */}
      <Route path="/faculty/dashboard" element={
        <ProtectedRoute allowedRole={['faculty', 'hod']}>
          <FacultyDashboard />
        </ProtectedRoute>
      } />

      {/* Admin/HOD Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRole={['admin', 'hod']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/user-management" element={
        <ProtectedRoute allowedRole="hod">
          <UserManagement />
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ComplaintProvider>
            <AppRoutes />
          </ComplaintProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
