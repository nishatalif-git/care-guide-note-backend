import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { loginSchema, registerSchema } from './auth.validation';
import * as authService from './auth.service';

export const authRouter = Router();


authRouter.post('/register', validate({ body: registerSchema }), async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

authRouter.post('/login', validate({ body: loginSchema }), async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await authService.getProfile(req.user!.id);
  res.json({ user });
});
