import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { idParam } from "../../validation/common";
import {
  createUserSchema,
  interestsQuerySchema,
  listUsersSchema,
  updateUserSchema,
  userPostsQuerySchema,
} from "./users.validation";
import * as usersService from "./users.service";

export const usersRouter = Router();


usersRouter.get(
  "/insights/by-interest",
  requireAuth,
  requireRole("admin"),
  validate({ query: interestsQuerySchema }),
  async (req, res) => {
    res.json(await usersService.groupUsersByInterest(req.query));
  },
);

usersRouter.get(
  "/:id/posts",
  validate({ params: idParam, query: userPostsQuerySchema }),
  async (req, res) => {
    res.json(
      await usersService.getUserPosts(req.params.id as string, req.query),
    );
  },
);



usersRouter.use(requireAuth, requireRole("admin"));

usersRouter.get("/", validate({ query: listUsersSchema }), async (req, res) => {
  res.json(await usersService.listUsers(req.query));
});

usersRouter.post("/", validate({ body: createUserSchema }), async (req, res) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json({ user });
});

usersRouter.get("/:id", validate({ params: idParam }), async (req, res) => {
  const user = await usersService.getUser(req.params.id as string);
  res.json({ user });
});

usersRouter.patch(
  "/:id",
  validate({ params: idParam, body: updateUserSchema }),
  async (req, res) => {
    const user = await usersService.updateUser(
      req.params.id as string,
      req.body,
    );
    res.json({ user });
  },
);

usersRouter.delete("/:id", validate({ params: idParam }), async (req, res) => {
  await usersService.deleteUser(req.user!.id, req.params.id as string);
  res.status(204).send();
});
