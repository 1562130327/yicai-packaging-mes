import { Router, Request, Response } from 'express';
import { queryAll } from '../../../infrastructure/database.js';

export function createTraceRoutes(): Router {
  const router = Router();

  router.get('/:orderId', (req: Request, res: Response) => {
    try {
      const events = queryAll(`SELECT * FROM trace_events WHERE order_id = ? ORDER BY created_at ASC`, [req.params.orderId]);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
