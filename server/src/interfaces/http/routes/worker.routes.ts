import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../../../infrastructure/database.js';

export function createWorkerRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const workers = queryAll(`SELECT id, name, role, skills, status FROM workers ORDER BY name`);
      res.json({ success: true, data: workers.map(w => ({
        id: w.id, name: w.name, role: w.role,
        skills: w.skills ? JSON.parse(w.skills) : [], status: w.status,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/:id/tasks', (req: Request, res: Response) => {
    try {
      const worker = queryOne(`SELECT id, name, role FROM workers WHERE id = ?`, [req.params.id]);
      if (!worker) { res.status(404).json({ success: false, error: '工人不存在' }); return; }

      const tasks = queryAll(`
        SELECT t.id, t.order_id, t.step_id, t.status, t.worker,
               o.code as order_code, o.product_code, o.customer_name, o.priority,
               ps.type as step_type, ps.status as step_status, ps.flow_id,
               ps.required_qty, ps.completed_qty
        FROM tasks t
        JOIN orders o ON t.order_id = o.id
        JOIN process_steps ps ON t.step_id = ps.id
        WHERE t.worker = ? AND t.status != 'completed'
        ORDER BY CASE o.priority WHEN 'deadline' THEN 5 WHEN 'urgent' THEN 4 WHEN 'normal' THEN 3 ELSE 0 END DESC
      `, [req.params.id]);

      res.json({ success: true, data: { worker, tasks } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
