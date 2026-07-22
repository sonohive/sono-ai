import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';

interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/admin/auth/me');
          setAdmin(response.data);
        } catch (error) {
          console.error("Auth check failed:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdmin(null);
  };

  const hasPermission = (permission: string) => {
    if (!admin) return false;
    if (admin.role === 'superadmin') return true;
    return admin.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
