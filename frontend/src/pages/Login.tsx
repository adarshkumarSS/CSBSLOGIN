import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserCheck, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFacultyLogin, setIsFacultyLogin] = useState(false);
  const { login, isLoading, loginError, clearLoginError } = useAuth();
  const navigate = useNavigate();

  // Clear error when user starts typing
  useEffect(() => {
    if (loginError) {
      clearLoginError();
    }
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const expectedRole = isFacultyLogin ? 'faculty' : 'student';
        await login(email, password, expectedRole);
        // Navigation will happen automatically based on user role in App.tsx
      } catch (error) {
        // Error is handled by useAuth hook
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 mb-2">
            <img src="/asset/logo.png" alt="Logo" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Thiagarajar College of Engineering</h1>
          <p className="text-muted-foreground">Computer Science and Business Systems</p>
        </div>

        {/* Login Type Selection */}
        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={!isFacultyLogin ? "default" : "outline"}
            className="flex-1 button-hover"
            onClick={() => setIsFacultyLogin(false)}
          >
            <Users className="h-4 w-4 mr-2 icon-hover" />
            Student Login
          </Button>
          <Button
            type="button"
            variant={isFacultyLogin ? "default" : "outline"}
            className="flex-1 button-hover"
            onClick={() => setIsFacultyLogin(true)}
          >
            <UserCheck className="h-4 w-4 mr-2 icon-hover" />
            Faculty Login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isFacultyLogin ? 'Faculty Login' : 'Student Login'}</CardTitle>
            <CardDescription>
              {isFacultyLogin
                ? 'Login with your TCE faculty email'
                : 'Login with your student credentials'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Message */}
            {loginError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="text-sm font-medium">
                  {loginError}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isFacultyLogin ? "faculty@tce.edu" : "your.email@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full button-hover" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot Password?
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
