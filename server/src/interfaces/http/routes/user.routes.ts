import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../../../infrastructure/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yicai-packaging-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export function createUserRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const users = queryAll(`SELECT id, username, name, role, enabled FROM users ORDER BY name`);
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/register', (req: Request, res: Response) => {
    try {
      const { username, password, name, gender, role } = req.body;
      if (!username || !password || !name) {
        res.status(400).json({ success: false, error: '工号、密码、姓名为必填' }); return;
      }
      const existing = queryOne(`SELECT id FROM users WHERE username = ?`, [username]);
      if (existing) {
        res.status(400).json({ success: false, error: '该工号已注册' }); return;
      }
      const id = uuidv4();
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      execute(`INSERT INTO users (id, username, password_hash, name, role, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'))`,
        [id, username, passwordHash, name, role || 'worker']);
      res.status(201).json({ success: true, data: { id, username, name, role: role || 'worker' } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/login', (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = queryOne(`SELECT id, username, name, role, enabled, password_hash FROM users WHERE username = ?`, [username]);
      if (!user) {
        res.status(401).json({ success: false, error: '用户名或密码错误' }); return;
      }
      const valid = bcrypt.compareSync(password || '', user.password_hash);
      if (!valid) {
        res.status(401).json({ success: false, error: '用户名或密码错误' }); return;
      }
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      res.json({ success: true, data: { id: user.id, username: user.username, name: user.name, role: user.role, enabled: user.enabled, token } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
