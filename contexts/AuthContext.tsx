'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { User } from '@/types/order';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, firstName: string, lastName: string, password: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      // Fetch full user data from API
      fetch('/api/user')
        .then((res) => res.json())
        .then((userData) => {
          setUser(userData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [session, status]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      return result?.ok ?? false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, password }),
      });

      if (response.ok) {
        // Auto-login after registration
        return await login(email, password);
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    signOut({ redirect: false });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isAuthenticated: !!session?.user,
        isAdmin: (session?.user as any)?.role === 'admin',
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
