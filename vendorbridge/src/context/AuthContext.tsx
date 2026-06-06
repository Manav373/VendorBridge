import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company?: string;
  department?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  role?: string;
  company?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(apiUser: any): User {
  return {
    id: apiUser.id,
    firstName: apiUser.first_name ?? apiUser.firstName,
    lastName: apiUser.last_name ?? apiUser.lastName,
    email: apiUser.email,
    role: apiUser.role,
    company: apiUser.company,
    department: apiUser.department,
    avatarUrl: apiUser.avatar_url ?? apiUser.avatarUrl,
    isVerified: apiUser.is_verified ?? apiUser.isVerified,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user from stored token
  useEffect(() => {
    const token = localStorage.getItem('vb_token');
    const storedUser = localStorage.getItem('vb_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('vb_user');
      }
      // Optionally refresh profile from server
      authService.getProfile()
        .then((profile) => {
          const u = mapUser(profile);
          setUser(u);
          localStorage.setItem('vb_user', JSON.stringify(u));
        })
        .catch(() => {
          // Token expired or invalid — clear session
          localStorage.removeItem('vb_token');
          localStorage.removeItem('vb_user');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await authService.login({ email, password });
      const { user: apiUser, accessToken, refreshToken } = res.data;
      const u = mapUser(apiUser);
      localStorage.setItem('vb_token', accessToken);
      localStorage.setItem('vb_refresh_token', refreshToken);
      localStorage.setItem('vb_user', JSON.stringify(u));
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_refresh_token');
    localStorage.removeItem('vb_user');
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const res: any = await authService.signup(data);
      const { user: apiUser, accessToken, refreshToken } = res.data;
      const u = mapUser(apiUser);
      localStorage.setItem('vb_token', accessToken);
      localStorage.setItem('vb_refresh_token', refreshToken);
      localStorage.setItem('vb_user', JSON.stringify(u));
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('vb_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
