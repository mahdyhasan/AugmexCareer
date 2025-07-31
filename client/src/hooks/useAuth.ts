import { useState, useEffect, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'recruiter';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isHR: boolean;
  isRecruiter: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start - but only once
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Important for session cookies
        });
        if (response.ok && mounted) {
          const { user } = await response.json();
          setUser(user);
        }
      } catch (error) {
        // Authentication failed, user is not logged in
        console.log('Not authenticated');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user } = await response.json();
    setUser(user);
    setIsLoading(false);
    return user;
  };

  const logout = async (): Promise<void> => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isHR: user?.role === 'hr',
    isRecruiter: user?.role === 'recruiter',
  };
}