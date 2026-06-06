import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  company: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  additionalInfo?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: User = {
  id: '1',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex@vendorbridge.com',
  role: 'Procurement Manager',
  company: 'TechCorp Solutions',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vb_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const u = { ...MOCK_USER, email };
    setUser(u);
    localStorage.setItem('vb_user', JSON.stringify(u));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vb_user');
  };

  const register = async (_data: RegisterData) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
