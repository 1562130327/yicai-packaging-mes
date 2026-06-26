import { Express } from 'express';
import { TaskRepository } from '../../../infrastructure/repositories/TaskRepository.js';
import { WorkflowRepository } from '../../../infrastructure/repositories/WorkflowRepository.js';
import { eventBus, eventStore } from '../../../infrastructure/events/index.js';
import { TaskService } from '../../../application/TaskService.js';
import { WorkflowService } from '../../../application/WorkflowService.js';
import { createTaskV2Routes } from './task-v2.routes.js';
import { authMiddleware } from '../middleware/auth.js';
import { createUserRoutes } from './user.routes.js';
import { createDashboardRoutes } from './dashboard.routes.js';
import { createOrderRoutes } from './order.routes.js';
import { createMachineRoutes } from './machine.routes.js';
import { createWorkerRoutes } from './worker.routes.js';
import { createInventoryRoutes } from './inventory.routes.js';
import { createCustomerRoutes } from './customer.routes.js';
import { createProcessRoutes } from './process.routes.js';
import { createFeedbackRoutes } from './feedback.routes.js';
import { createReportRoutes } from './report.routes.js';
import { createTraceRoutes } from './trace.routes.js';
import { createMaterialRoutes } from './material.routes.js';
import { createWorkersAdminRoutes } from './workers-admin.routes.js';

// 简化的依赖注入
const taskRepo = new TaskRepository();
const workflowRepo = new WorkflowRepository();
const taskService = new TaskService(taskRepo, eventBus, eventStore);
const workflowService = new WorkflowService(workflowRepo, taskService, eventBus, eventStore);

export function registerRoutesV2(app: Express): void {
  // 健康检查
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '2.0', timestamp: new Date().toISOString() });
  });

  // 登录/注册（无需认证）
  app.use('/api/users', createUserRoutes());

  // 以下路由需要认证
  app.use('/api/dashboard', authMiddleware, createDashboardRoutes());
  app.use('/api/orders', authMiddleware, createOrderRoutes());
  app.use('/api/tasks', authMiddleware, createTaskV2Routes(taskService)); // 新架构 Task API
  app.use('/api/machines', authMiddleware, createMachineRoutes());
  app.use('/api/workers', authMiddleware, createWorkerRoutes());
  app.use('/api/workers-admin', authMiddleware, createWorkersAdminRoutes());
  app.use('/api/inventory', authMiddleware, createInventoryRoutes());
  app.use('/api/customers', authMiddleware, createCustomerRoutes());
  app.use('/api/processes', authMiddleware, createProcessRoutes());
  app.use('/api/feedback', authMiddleware, createFeedbackRoutes());
  app.use('/api/reports', authMiddleware, createReportRoutes());
  app.use('/api/traces', authMiddleware, createTraceRoutes());
  app.use('/api/materials', authMiddleware, createMaterialRoutes());

  // 事件查询（调试用）
  app.get('/api/events', authMiddleware, (_req, res) => {
    try {
      const events = eventStore.findRecent(50);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log('[Routes V2] New architecture + legacy routes registered');
}
