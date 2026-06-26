import { Router, Request, Response } from 'express';
import { queryOne } from '../../../infrastructure/database.js';

export function createReportRoutes(): Router {
  const router = Router();

  router.get('/summary', (_req: Request, res: Response) => {
    try {
      const totalOrders = queryOne(`SELECT COUNT(*) as count FROM orders`);
      const completedOrders = queryOne(`SELECT COUNT(*) as count FROM orders WHERE status = 'completed'`);
      const pendingOrders = queryOne(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`);
      const totalMachines = queryOne(`SELECT COUNT(*) as count FROM machines`);
      const runningMachines = queryOne(`SELECT COUNT(*) as count FROM machines WHERE status = 'running'`);
      const totalWorkers = queryOne(`SELECT COUNT(*) as count FROM workers`);
      const anomalyCount = queryOne(`SELECT COUNT(*) as count FROM anomaly_events`);
      const completionCount = queryOne(`SELECT COUNT(*) as count FROM completion_records`);

      res.json({ success: true, data: {
        orders: { total: totalOrders?.count || 0, completed: completedOrders?.count || 0, pending: pendingOrders?.count || 0 },
        machines: { total: totalMachines?.count || 0, running: runningMachines?.count || 0 },
        workers: totalWorkers?.count || 0,
        anomalies: anomalyCount?.count || 0,
        completions: completionCount?.count || 0,
      } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
