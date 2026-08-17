import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

type MongoDuplicateKeyError = { code: number; keyValue?: Record<string, unknown> };

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * Single place where an error becomes a response body. Every branch produces
 * `{ error: { message, details? } }` so the client parses one shape.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // The unique index on users.email surfaces here on a racing double-register.
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    res.status(409).json({
      error: {
        message: `A record with that ${field} already exists`,
        details: [{ field, message: 'must be unique' }],
      },
    });
    return;
  }

  if (err instanceof MongooseError.ValidationError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
      },
    });
    return;
  }

  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      error: { message: 'Malformed value', details: [{ field: err.path, message: 'is invalid' }] },
    });
    return;
  }

  console.error('[error] unhandled:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      // Stack traces are development-only; production leaks nothing.
      ...(isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
};
