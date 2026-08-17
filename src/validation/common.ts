import Joi from 'joi';
import { Types } from 'mongoose';


//Rejects a malformed id at the edge so it never reaches a Mongoose cast. 
export const objectId = Joi.string()
  .custom((value: string, helpers) =>
    Types.ObjectId.isValid(value) ? value : helpers.error('any.invalid'),
  )
  .messages({ 'any.invalid': 'must be a valid id' });

export const idParam = Joi.object({ id: objectId.required() });

export const password = Joi.string().min(8).max(128);

export const email = Joi.string().email().max(254).lowercase().trim();
