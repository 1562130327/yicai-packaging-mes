import { Router, Request, Response } from 'express';
import { ExecutionService } from '../../../application/ExecutionService.js';

export function createExecutionRoutes(executionService: ExecutionService): Router {
  const router = Router();

  // POST /api/executions — 记录生产
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { taskId, workerId, machineId, quantity, defectQty, notes } = req.body;
      if (!taskId || !workerId || !quantity) {
        res.status(400).json({ success: false, error: '缺少必填字段: taskId, workerId, quantity' });
        return;
      }
      const execution = await executionService.recordExecution({ taskId, workerId, machineId, quantity, defectQty, notes });
      res.status(201).json({ success: true, data: { id: execution.id, goodQty: execution.goodQty, yieldRate: execution.yieldRate } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/executions — 生产记录列表
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { taskId } = req.query;
      if (taskId) {
        const executions = await executionService.getExecutionsByTask(taskId as string);
        res.json({ success: true, data: executions.map(e => ({
          id: e.id, taskId: e.taskId, workerId: e.workerId,
          quantity: e.quantity, defectQty: e.defectQty, goodQty: e.goodQty,
          yieldRate: e.yieldRate, recordedAt: e.recordedAt,
        })) });
      } else {
        res.json({ success: true, data: [] });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
