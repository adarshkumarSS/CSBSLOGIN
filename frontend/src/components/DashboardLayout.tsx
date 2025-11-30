import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Navigation from './Navigation';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBackToHod?: boolean;
  additionalContent?: ReactNode;
}

const DashboardLayout = ({
  title,
  subtitle,
  children,
  showBackToHod = false,
  additionalContent
}: DashboardLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            {showBackToHod && user?.role === 'hod' && (
              <div className="mb-4">
                <Button variant="outline" className="button-hover" asChild>
                  <a href="/hod/dashboard">← Back to HOD Dashboard</a>
                </Button>
              </div>
            )}

            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground text-lg">{subtitle}</p>
              )}

              {additionalContent}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
