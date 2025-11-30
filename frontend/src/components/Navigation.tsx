import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Navigation = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-primary border-b border-primary/20 sticky top-0 z-10 shadow-lg w-full">
      <div className="w-full px-2 h-20 flex items-center justify-between">
        {/* Leftmost corner - College name */}
        <div className="flex items-center gap-2 px-2 py-3 rounded-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg">
            <img src="/asset/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-white">Thiagarajar College of Engineering</h1>
            <p className="text-sm text-white/80">Computer Science and Business Systems</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-lg font-semibold text-white">TCE</h1>
          </div>
        </div>

        {/* Rightmost corner - Logout button */}
        <div className="flex items-center">
          <Button
            variant="secondary"
            size="default"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-primary hover:bg-white/90 border-white/20"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
