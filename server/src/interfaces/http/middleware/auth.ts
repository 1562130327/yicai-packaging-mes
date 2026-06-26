import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'yicai-packaging-secret-key-2024';

export interface AuthRequest extends Request {
  user?: { id: string; username: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '登录已过期，请重新登录' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '无权限访问' });
      return;
    }
    next();
  };
}
