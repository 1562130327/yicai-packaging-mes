import { Express } from 'express';
import { TaskRepository } from '../../../infrastructure/repositories/TaskRepository.js';
import { WorkflowRepository } from '../../../infrastructure/repositories/WorkflowRepository.js';
import { ExecutionRepository } from '../../../infrastructure/repositories/ExecutionRepository.js';
import { MaterialRepository } from '../../../infrastructure/repositories/MaterialRepository.js';
import { ExceptionRepository } from '../../../infrastructure/repositories/ExceptionRepository.js';
import { eventBus, eventStore } from '../../../infrastructure/events/index.js';
import { TaskService } from '../../../application/TaskService.js';
import { WorkflowService } from '../../../application/WorkflowService.js';
import { ExecutionService } from '../../../application/ExecutionService.js';
import { MaterialService } from '../../../application/MaterialService.js';
import { ExceptionService } from '../../../application/ExceptionService.js';
import { createTaskV2Routes } from './task-v2.routes.js';
import { createExecutionRoutes } from './execution.routes.js';
import { createMaterialV2Routes } from './material-v2.routes.js';
import { createExceptionRoutes } from './exception.routes.js';
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
import { createWorkersAdminRoutes } from './workers-admin.routes.js';

// ========== 依赖注入 ==========
const taskRepo = new TaskRepository();
const workflowRepo = new WorkflowRepository();
const executionRepo = new ExecutionRepository();
const materialRepo = new MaterialRepository();
const exceptionRepo = new ExceptionRepository();

const taskService = new TaskService(taskRepo, eventBus, eventStore);
const workflowService = new WorkflowService(workflowRepo, taskService, eventBus, eventStore);
const executionService = new ExecutionService(executionRepo, eventBus, eventStore);
const materialService = new MaterialService(materialRepo, eventBus, eventStore);
const exceptionService = new ExceptionService(exceptionRepo, taskService, eventBus, eventStore);

// ========== 注册事件处理器 ==========
// TaskCompleted → ExecutionService (记录生产)
eventBus.on('task.completed', async (event) => {
  console.log(`[EventHandler] TaskCompleted: ${event.aggregateId}`);
});

// ExceptionRaised → TaskPaused (异常暂停任务)
eventBus.on('exception.raised', async (event) => {
  console.log(`[EventHandler] ExceptionRaised: ${event.aggregateId}`);
});

// MaterialStockLow → 通知
eventBus.on('material.stock_low', async (event) => {
  console.log(`[EventHandler] MaterialStockLow: ${event.payload.batchNo}`);
});

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
  app.use('/api/tasks', authMiddleware, createTaskV2Routes(taskService));
  app.use('/api/executions', authMiddleware, createExecutionRoutes(executionService));
  app.use('/api/materials', authMiddleware, createMaterialV2Routes(materialService));
  app.use('/api/exceptions', authMiddleware, createExceptionRoutes(exceptionService));
  app.use('/api/machines', authMiddleware, createMachineRoutes());
  app.use('/api/workers', authMiddleware, createWorkerRoutes());
  app.use('/api/workers-admin', authMiddleware, createWorkersAdminRoutes());
  app.use('/api/inventory', authMiddleware, createInventoryRoutes());
  app.use('/api/customers', authMiddleware, createCustomerRoutes());
  app.use('/api/processes', authMiddleware, createProcessRoutes());
  app.use('/api/feedback', authMiddleware, createFeedbackRoutes());
  app.use('/api/reports', authMiddleware, createReportRoutes());
  app.use('/api/traces', authMiddleware, createTraceRoutes());

  // 事件查询（调试用）
  app.get('/api/events', authMiddleware, (_req, res) => {
    try {
      const events = eventStore.findRecent(50);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log('[Routes V2] All modules registered (Task + Execution + Material + Exception)');
}
