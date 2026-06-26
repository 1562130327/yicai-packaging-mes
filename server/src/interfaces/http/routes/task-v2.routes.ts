import { Router, Request, Response } from 'express';
import { TaskService } from '../../../application/TaskService.js';
import { validate, CreateTaskSchema } from '../../../shared/validation.js';

export function createTaskV2Routes(taskService: TaskService): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const v = validate(CreateTaskSchema, req.body);
      if (!v.success) { res.status(400).json({ success: false, error: v.error }); return; }
      const task = await taskService.createTask(v.data);
      res.status(201).json({ success: true, data: { id: task.id, status: task.status } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { status, workerId, orderId } = req.query;
      const tasks = await taskService.listTasks({ status: status as string, workerId: workerId as string, orderId: orderId as string });
      res.json({ success: true, data: tasks.map(t => ({ id: t.id, stepId: t.stepId, orderId: t.orderId, workerId: t.workerId, machineId: t.machineId, status: t.status, priority: t.priority, quantity: t.quantity, completedQty: t.completedQty, startedAt: t.startedAt, completedAt: t.completedAt })) });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.get('/stats', async (_req: Request, res: Response) => {
    try { res.json({ success: true, data: await taskService.getStats() }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const task = await taskService.getTask(req.params.id);
      if (!task) { res.status(404).json({ success: false, error: 'Not found' }); return; }
      res.json({ success: true, data: { id: task.id, stepId: task.stepId, orderId: task.orderId, workerId: task.workerId, machineId: task.machineId, status: task.status, priority: task.priority, quantity: task.quantity, completedQty: task.completedQty } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.put('/:id/assign', async (req: Request, res: Response) => {
    try {
      const { workerId, machineId } = req.body;
      if (!workerId || !machineId) { res.status(400).json({ success: false, error: 'Missing workerId or machineId' }); return; }
      await taskService.assignTask(req.params.id, workerId, machineId);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.put('/:id/start', async (req: Request, res: Response) => {
    try { await taskService.startTask(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.put('/:id/complete', async (req: Request, res: Response) => {
    try {
      const { quantity, defectQty } = req.body;
      if (!quantity) { res.status(400).json({ success: false, error: 'Missing quantity' }); return; }
      await taskService.completeTask(req.params.id, quantity, defectQty || 0);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.put('/:id/pause', async (req: Request, res: Response) => {
    try { await taskService.pauseTask(req.params.id, req.body.reason || 'Paused'); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.put('/:id/resume', async (req: Request, res: Response) => {
    try { await taskService.resumeTask(req.params.id); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.put('/:id/cancel', async (req: Request, res: Response) => {
    try { await taskService.cancelTask(req.params.id, req.body.reason || 'Cancelled'); res.json({ success: true }); }
    catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  });

  return router;
}
