import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRouter } from './modules/auth/auth.routes';
import { notesRouter } from './modules/notes/notes.routes';
import { usersRouter } from './modules/users/users.routes';
import { postsRouter } from './modules/posts/posts.routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: false }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/notes', notesRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/posts', postsRouter);


  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
