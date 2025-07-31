import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hr' | 'recruiter';
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  loginTime: number;
}

const SALT_ROUNDS = 12;
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createUser(userData: z.infer<typeof insertUserSchema>): Promise<AuthUser> {
    // Hash password before storing
    const hashedPassword = await this.hashPassword(userData.password);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.fullName || user.email,
      role: user.role as 'admin' | 'hr' | 'recruiter',
    };
  }

  async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.fullName || user.email,
      role: user.role as 'admin' | 'hr' | 'recruiter',
    };
  }

  createSession(user: AuthUser): SessionData {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginTime: Date.now(),
    };
  }

  isSessionValid(session: SessionData): boolean {
    const now = Date.now();
    return (now - session.loginTime) < SESSION_DURATION;
  }

  hasPermission(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  // Role hierarchy: admin > hr > recruiter
  hasMinimumRole(userRole: string, minimumRole: 'admin' | 'hr' | 'recruiter'): boolean {
    const roleHierarchy = { admin: 3, hr: 2, recruiter: 1 };
    return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[minimumRole];
  }
}

export const authService = new AuthService();

// Middleware for protecting routes
export function requireAuth(req: any, res: any, next: any) {
  const session = req.session?.user;
  
  if (!session || !authService.isSessionValid(session)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  req.user = session;
  next();
}

export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    
    if (!user || !authService.hasPermission(user.role, roles)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}

export function requireMinimumRole(minimumRole: 'admin' | 'hr' | 'recruiter') {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    
    if (!user || !authService.hasMinimumRole(user.role, minimumRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}