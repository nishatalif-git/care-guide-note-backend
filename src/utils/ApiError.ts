export type FieldError = { field: string; message: string };

export class ApiError extends Error {
  readonly status: number;
  readonly details?: FieldError[];

  constructor(status: number, message: string, details?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request', details?: FieldError[]) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }
}
