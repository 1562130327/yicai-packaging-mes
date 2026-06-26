import { Router, Request, Response } from 'express';
import { TaskFlowEngine } from '../../../modules/task-flow/TaskFlowEngine.js';

export function createTaskFlowRoutes(taskFlowEngine: TaskFlowEngine): Router {
  const router = Router();

  // POST /api/task-flow/start — 启动工作流（Order → Workflow → Task）
  router.post('/start', async (req: Request, res: Response) => {
    try {
      const { orderId, templateName, quantity } = req.body;
      if (!orderId || !templateName || !quantity) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }
      await taskFlowEngine.startWorkflow(orderId, templateName, quantity);
      res.json({ success: true, message: 'Workflow started' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
