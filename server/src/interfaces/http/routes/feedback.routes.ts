import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, execute } from '../../../infrastructure/database.js';

export function createFeedbackRoutes(): Router {
  const router = Router();

  router.post('/', (req: Request, res: Response) => {
    try {
      const { orderId, processStepId, flowId, type, description, severity } = req.body;
      if (!orderId || !processStepId || !type || !description) {
        res.status(400).json({ success: false, error: '缺少必填字段' }); return;
      }
      if (flowId && processStepId) {
        execute(`UPDATE process_steps SET status = 'paused' WHERE id = ?`, [processStepId]);
      }
      execute(`INSERT INTO anomaly_events (id, order_id, process_step_id, type, description, severity, detected_at, trigger_supplement) VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'), 0)`,
        [uuidv4(), orderId, processStepId, type, description, severity || 'medium']);
      execute(`INSERT INTO trace_events (id, order_id, event_type, metadata, created_at) VALUES (?, ?, 'anomaly_detected', ?, datetime('now','localtime'))`,
        [uuidv4(), orderId, JSON.stringify({ type, description, severity })]);
      res.json({ success: true, message: '反馈已提交，工序已暂停' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/', (_req: Request, res: Response) => {
    try {
      const events = queryAll(`
        SELECT ae.*, o.code as order_code FROM anomaly_events ae
        LEFT JOIN orders o ON ae.order_id = o.id ORDER BY ae.detected_at DESC LIMIT 50
      `);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
