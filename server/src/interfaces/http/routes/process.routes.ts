import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../../../infrastructure/database.js';

export function createProcessRoutes(): Router {
  const router = Router();

  router.get('/:orderId', (req: Request, res: Response) => {
    try {
      const flow = queryOne(`SELECT * FROM process_flows WHERE order_id = ?`, [req.params.orderId]);
      if (!flow) { res.status(404).json({ success: false, error: '工序流不存在' }); return; }
      const steps = queryAll(`SELECT * FROM process_steps WHERE flow_id = ? ORDER BY sequence`, [flow.id]);
      res.json({ success: true, data: { ...flow, steps } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.put('/advance', (req: Request, res: Response) => {
    try {
      const { flowId, stepId, toStatus } = req.body;
      if (!flowId || !stepId || !toStatus) {
        res.status(400).json({ success: false, error: '缺少必填字段' }); return;
      }
      execute(`UPDATE process_steps SET status = ?, started_at = CASE WHEN ? = 'running' THEN datetime('now','localtime') ELSE started_at END WHERE id = ?`,
        [toStatus, toStatus, stepId]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/complete', (req: Request, res: Response) => {
    try {
      const { flowId, stepId, quantity, worker, defectQty, notes } = req.body;
      if (!flowId || !stepId || !quantity || !worker) {
        res.status(400).json({ success: false, error: '缺少必填字段' }); return;
      }
      execute(`UPDATE process_steps SET completed_qty = completed_qty + ?, defect_qty = defect_qty + ? WHERE id = ?`,
        [quantity, defectQty || 0, stepId]);
      execute(`INSERT INTO completion_records (id, step_id, worker, quantity, defect_qty, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))`,
        [uuidv4(), stepId, worker, quantity, defectQty || 0, notes || '']);
      res.json({ success: true, message: `工序完成: +${quantity}件` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
