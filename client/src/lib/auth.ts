import { User } from "@/types";

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  async login(email: string, password: string): Promise<User> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await response.json();
    this.currentUser = data.user;
    return data.user;
  }

  async register(userData: {
    email: string;
    password: string;
    fullName?: string;
    role?: string;
  }): Promise<User> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    const data = await response.json();
    this.currentUser = data.user;
    return data.user;
  }

  logout(): void {
    this.currentUser = null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === "admin" || this.currentUser?.role === "hr";
  }

  isCandidate(): boolean {
    return this.currentUser?.role === "candidate" || !this.currentUser;
  }
}

export const authService = AuthService.getInstance();
