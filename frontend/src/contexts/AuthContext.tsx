import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'student' | 'faculty' | 'hod' | 'admin';

interface User {
  id: string;
  role: UserRole;
  email: string;
  name?: string;
  rollNumber?: string;
  year?: string;
  department?: string;
  employeeId?: string;
  designation?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, expectedRole?: 'student' | 'faculty') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setUserYear?: (year: string) => void;
  userYear?: string;
  loginError: string | null;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('authToken'));
  const [userYear, setUserYearState] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token with backend and set user
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, expectedRole?: 'student' | 'faculty') => {
    setIsLoading(true);
    setLoginError(null); // Clear any previous errors

    // Frontend validation: check if email domain matches expected role
    if (expectedRole) {
      const isFacultyEmail = email.includes('@tce.edu') || email.includes('@thiagarajar');
      const isStudentEmail = !isFacultyEmail;

      if (expectedRole === 'student' && isFacultyEmail) {
        const errorMessage = 'Faculty email cannot be used for student login. Please use faculty login.';
        setLoginError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }

      if (expectedRole === 'faculty' && isStudentEmail) {
        const errorMessage = 'Student email cannot be used for faculty login. Please use student login.';
        setLoginError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, expectedRole })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || 'Login failed';
        setLoginError(errorMessage);
        throw new Error(errorMessage);
      }

      // Store token and set user
      localStorage.setItem('authToken', data.data.token);
      setUser(data.data.user);

    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUserYearState('');
    localStorage.removeItem('authToken');
  };

  const setUserYear = (year: string) => {
    setUserYearState(year);
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    setUserYear,
    userYear,
    loginError,
    clearLoginError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
