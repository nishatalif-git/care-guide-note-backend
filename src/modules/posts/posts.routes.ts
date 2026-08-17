import { Router } from "express";
import Joi from "joi";
import { Types } from "mongoose";
import { Post } from "../../models/post.model";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { paginationQuery } from "../../validation/common";
import { listPosts } from "./posts.service";

export const postsRouter = Router();

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  body: Joi.string().min(1).max(20000).required(),
});


const listPostsSchema = Joi.object({
  ...paginationQuery,
  author: Joi.string().trim().max(254),
});


// since posts are public, there is no need to add auth middleware
postsRouter.get("/", validate({ query: listPostsSchema }), async (req, res) => {
  res.json(await listPosts(req.query));
});

postsRouter.post(
  "/",
  requireAuth,
  validate({ body: createPostSchema }),
  async (req, res) => {
    const created = await Post.create({
      title: req.body.title,
      body: req.body.body,
      author: new Types.ObjectId(req.user!.id),
    });

    res.status(201).json({
      post: {
        id: String(created._id),
        title: created.title,
        body: created.body,
        author: String(created.author),
        createdAt: created.createdAt,
      },
    });
  },
);
