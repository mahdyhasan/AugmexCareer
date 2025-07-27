import { useState, useEffect } from "react";
import { User } from "@/types";
import { authService } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    fullName?: string;
    role?: string;
  }) => {
    setLoading(true);
    try {
      const user = await authService.register(userData);
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: authService.isAdmin(),
    isCandidate: authService.isCandidate(),
  };
}
