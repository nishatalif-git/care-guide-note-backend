import type { RequestHandler } from 'express';
import type { ObjectSchema } from 'joi';
import { ApiError, type FieldError } from '../utils/ApiError';

type Schemas = {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
};

const OPTIONS = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};


export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const errors: FieldError[] = [];

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const { value, error } = schema.validate(req[part] ?? {}, OPTIONS);

      if (error) {
        for (const detail of error.details) {
          errors.push({
            field: detail.path.join('.') || part,
            message: detail.message.replace(/"/g, "'"),
          });
        }
        continue;
      }

      if (part === 'query') {
        Object.defineProperty(req, 'query', {
          value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } else {
        req[part] = value;
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }
    return next();
  };
}
