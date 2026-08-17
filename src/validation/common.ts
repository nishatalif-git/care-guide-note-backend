import Joi from 'joi';
import { Types } from 'mongoose';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../utils/pagination';


//Rejects a malformed id at the edge so it never reaches a Mongoose cast. 
export const objectId = Joi.string()
  .custom((value: string, helpers) =>
    Types.ObjectId.isValid(value) ? value : helpers.error('any.invalid'),
  )
  .messages({ 'any.invalid': 'must be a valid id' });

export const idParam = Joi.object({ id: objectId.required() });

export const password = Joi.string().min(8).max(128);

export const email = Joi.string().email().max(254).lowercase().trim();

export const paginationQuery = {
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
};