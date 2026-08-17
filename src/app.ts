import express from 'express';
import cors from 'cors';
import { env } from './config/env';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });



  return app;
}
