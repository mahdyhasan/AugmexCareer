import { SessionData } from "../services/auth";

declare global {
  namespace Express {
    interface Request {
      user?: SessionData;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user?: SessionData;
  }
}