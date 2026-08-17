import Joi from "joi";
import { objectId, paginationQuery } from "../../validation/common";

export const createNoteSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().min(1).max(20000).required(),
});

export const updateNoteSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  content: Joi.string().min(1).max(20000),
})
  .min(1)
  .messages({ "object.min": "provide at least one of title or content" });


export const listNotesSchema = Joi.object({
  ...paginationQuery,
  all: Joi.boolean().default(false),
  owner: objectId,
});
