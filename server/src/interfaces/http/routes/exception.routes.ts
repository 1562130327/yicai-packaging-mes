import { Router, Request, Response } from 'express';
import { ExceptionService } from '../../../application/ExceptionService.js';

export function createExceptionRoutes(exceptionService: ExceptionService): Router {
  const router = Router();

  // POST /api/exceptions — 上报异常
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { taskId, type, severity, description } = req.body;
      if (!taskId || !type || !description) {
        res.status(400).json({ success: false, error: '缺少必填字段' });
        return;
      }
      const exception = await exceptionService.raiseException({ taskId, type, severity: severity || 'medium', description });
      res.status(201).json({ success: true, data: { id: exception.id, status: 'open' } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/exceptions — 异常列表
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const exceptions = await exceptionService.listAll();
      res.json({ success: true, data: exceptions.map(e => ({
        id: e.id, taskId: e.taskId, type: e.type, severity: e.severity,
        description: e.description, status: e.status, detectedAt: e.detectedAt,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/exceptions/open — 未解决异常
  router.get('/open', async (_req: Request, res: Response) => {
    try {
      const exceptions = await exceptionService.listOpen();
      res.json({ success: true, data: exceptions.map(e => ({
        id: e.id, taskId: e.taskId, type: e.type, severity: e.severity,
        description: e.description, detectedAt: e.detectedAt,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUT /api/exceptions/:id/resolve — 解决异常
  router.put('/:id/resolve', async (req: Request, res: Response) => {
    try {
      const { resolution } = req.body;
      if (!resolution) {
        res.status(400).json({ success: false, error: '缺少 resolution' });
        return;
      }
      await exceptionService.resolveException(req.params.id, resolution);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
}
