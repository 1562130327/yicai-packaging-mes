import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { execute } from '../../../infrastructure/database.js';

export function createWorkersAdminRoutes(): Router {
  const router = Router();

  router.post('/', (req: Request, res: Response) => {
    try {
      const { name, role, skills, phone } = req.body;
      if (!name) { res.status(400).json({ success: false, error: '姓名为必填' }); return; }
      const id = uuidv4();
      execute(`INSERT INTO workers (id, name, role, skills, status, phone, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, datetime('now','localtime'), datetime('now','localtime'))`,
        [id, name, role || '师傅', JSON.stringify(skills || []), phone || '']);
      res.status(201).json({ success: true, data: { id, name } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.delete('/:id', (req: Request, res: Response) => {
    try {
      execute(`DELETE FROM workers WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
