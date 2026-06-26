import { Router, Request, Response } from 'express';
import { queryAll, execute } from '../../../infrastructure/database.js';

export function createMachineRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const machines = queryAll(`SELECT id, code, name, type, status, process_types, workshop FROM machines ORDER BY code`);
      res.json({ success: true, data: machines.map(m => ({
        id: m.id, code: m.code, name: m.name, type: m.type, status: m.status,
        processTypes: m.process_types ? JSON.parse(m.process_types) : [], workshop: m.workshop,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.put('/:id/status', (req: Request, res: Response) => {
    try {
      execute(`UPDATE machines SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?`, [req.body.status, req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
