import type { Role } from "../models/user.model";

/** Shape attached to the request by requireAuth - never the full user doc. */
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
