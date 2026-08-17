import Joi from 'joi';
import { ROLES } from '../../models/user.model';
import { email, paginationQuery, password } from "../../validation/common";

const interests = Joi.array()
  .items(Joi.string().trim().lowercase().min(1).max(50))
  .max(20);

export const listUsersSchema = Joi.object({ ...paginationQuery });

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: email.required(),
  password: password.required(),
  // Admin-created accounts may be admins; the route is admin-guarded.
  role: Joi.string().valid(...ROLES).default('user'),
  interests: interests.default([]),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  email,
  password,
  role: Joi.string().valid(...ROLES),
  interests,
})
  .min(1)
  .messages({ 'object.min': 'provide at least one field to update' });

/** Scenario 1: optional single-interest filter, which the multikey index serves. */
export const interestsQuerySchema = Joi.object({
  ...paginationQuery,
  interest: Joi.string().trim().lowercase().min(1).max(50),
});

/** Scenario 2: pagination applies to the joined posts, not to the user. */
export const userPostsQuerySchema = Joi.object({ ...paginationQuery });
