import Joi from 'joi';
import { email, password } from '../../validation/common';


export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: email.required(),
  password: password.required(),
  interests: Joi.array().items(Joi.string().trim().lowercase().min(1).max(50)).max(20).default([]),
});

export const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});
