import type { Request, RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { ROLES, type Role } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import type { AuthUser } from '../types/express';

export type TokenPayload = JwtPayload & {
  sub: string;
  email: string;
  role: Role;
};

export function signToken(user: { id: string; email: string; role: Role }): string {
  return jwt.sign({ email: user.email, role: user.role }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  } as jwt.SignOptions);
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Verifies the bearer token and attaches the caller's identity.
 *
 * The role is read from the signed token rather than re-fetched, so a normal
 * request costs zero extra database round-trips. The trade-off is that a role
 * change takes effect at the next login (tokens are short-lived by config).
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) {
    return next(ApiError.unauthorized('Missing bearer token'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as TokenPayload;

    if (!payload.sub || !ROLES.includes(payload.role)) {
      return next(ApiError.unauthorized('Malformed token payload'));
    }

    const user: AuthUser = { id: payload.sub, email: payload.email, role: payload.role };
    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Token expired'));
    }
    return next(ApiError.unauthorized('Invalid token'));
  }
};

/** Route guard for admin-only areas. Must be mounted after requireAuth. */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${allowed.join(' or ')}`));
    }
    return next();
  };
}

export const isAdmin = (req: Request): boolean => req.user?.role === 'admin';
