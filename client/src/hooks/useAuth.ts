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
  login: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isHR: boolean;
  isRecruiter: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);

  // Check if user is logged in on app start
  const { data, isLoading } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
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