import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; organizationId: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  req.user = result.payload as AuthRequest['user'];
  next();
}
