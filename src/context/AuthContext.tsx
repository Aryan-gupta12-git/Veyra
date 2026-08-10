import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/user';
import { saveUserInterests as apiSaveUserInterests } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  saveInterests: (topicIds: string[]) => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('LOGIN FAILED', res.status, data);
        console.error('Request URL: /api/auth/login');
        console.error('Credentials included: true');
        const fallbackError = res.status >= 500 ? 'Server is offline or unreachable. Please try again later.' : 'Authentication failed';
        throw new Error(data.details || data.error || fallbackError);
      }

      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password: pass }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('REGISTER FAILED', res.status, data);
        console.error('Request URL: /api/auth/register');
        console.error('Credentials included: true');
        const fallbackError = res.status >= 500 ? 'Server is offline or unreachable. Please try again later.' : 'Registration failed';
        throw new Error(data.details || data.error || fallbackError);
      }

      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const saveInterests = async (topicIds: string[]) => {
    if (!user) return;
    try {
      const updatedUser = await apiSaveUserInterests(topicIds);
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to save interests:', err);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout request failed:', e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        saveInterests,
        isAdmin: user?.role === 'ADMIN',
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
