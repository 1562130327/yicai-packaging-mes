import { Router, Request, Response } from 'express';
import { TaskService } from '../../../application/TaskService.js';

/**
 * Task 路由（新架构）
 * 所有业务逻辑由 TaskService 处理
 */
export function createTaskV2Routes(taskService: TaskService): Router {
  const router = Router();

  // POST /api/tasks — 创建任务
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { stepId, orderId, quantity, priority, estimatedHours } = req.body;
      if (!stepId || !orderId || !quantity) {
        res.status(400).json({ success: false, error: '缺少必填字段: stepId, orderId, quantity' });
        return;
      }
      const task = await taskService.createTask({ stepId, orderId, quantity, priority, estimatedHours });
      res.status(201).json({ success: true, data: { id: task.id, status: task.status } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/tasks — 任务列表
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { status, workerId, orderId } = req.query;
      const tasks = await taskService.listTasks({
        status: status as string,
        workerId: workerId as string,
        orderId: orderId as string,
      });
      res.json({ success: true, data: tasks.map(t => ({
        id: t.id, stepId: t.stepId, orderId: t.orderId,
        workerId: t.workerId, machineId: t.machineId,
        status: t.status, priority: t.priority,
        quantity: t.quantity, completedQty: t.completedQty,
        startedAt: t.startedAt, completedAt: t.completedAt,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/tasks/stats — 任务统计
  router.get('/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await taskService.getStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/tasks/:id — 任务详情
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const task = await taskService.getTask(req.params.id);
      if (!task) {
        res.status(404).json({ success: false, error: 'Task not found' });
        return;
      }
      res.json({ success: true, data: {
        id: task.id, stepId: task.stepId, orderId: task.orderId,
        workerId: task.workerId, machineId: task.machineId,
        status: task.status, priority: task.priority,
        quantity: task.quantity, completedQty: task.completedQty,
        estimatedHours: task.estimatedHours, actualHours: task.actualHours,
        scheduledAt: task.scheduledAt, startedAt: task.startedAt, completedAt: task.completedAt,
      } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/tasks/:id/assign — 分配任务
  router.put('/:id/assign', async (req: Request, res: Response) => {
    try {
      const { workerId, machineId } = req.body;
      if (!workerId || !machineId) {
        res.status(400).json({ success: false, error: '缺少 workerId 或 machineId' });
        return;
      }
      await taskService.assignTask(req.params.id, workerId, machineId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // PUT /api/tasks/:id/start — 开始任务
  router.put('/:id/start', async (req: Request, res: Response) => {
    try {
      await taskService.startTask(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // PUT /api/tasks/:id/complete — 完成任务
  router.put('/:id/complete', async (req: Request, res: Response) => {
    try {
      const { quantity, defectQty } = req.body;
      if (!quantity) {
        res.status(400).json({ success: false, error: '缺少 quantity' });
        return;
      }
      await taskService.completeTask(req.params.id, quantity, defectQty || 0);
      res.json({ success: true, message: '任务完成' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // PUT /api/tasks/:id/pause — 暂停任务
  router.put('/:id/pause', async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      await taskService.pauseTask(req.params.id, reason || '手动暂停');
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // PUT /api/tasks/:id/resume — 恢复任务
  router.put('/:id/resume', async (req: Request, res: Response) => {
    try {
      await taskService.resumeTask(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // PUT /api/tasks/:id/cancel — 取消任务
  router.put('/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      await taskService.cancelTask(req.params.id, reason || '手动取消');
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
}
