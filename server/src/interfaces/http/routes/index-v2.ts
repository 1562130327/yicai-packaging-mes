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
import { TaskFlowEngine } from '../../../modules/task-flow/TaskFlowEngine.js';
import { registerEventHandlers } from '../../../modules/event-handlers/index.js';
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
import { createTaskFlowRoutes } from './task-flow.routes.js';

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

// ========== Task Flow 引擎 ==========
const taskFlowEngine = new TaskFlowEngine(taskService, eventBus, eventStore, workflowRepo);
taskFlowEngine.start();

// ========== 注册事件处理器 ==========
registerEventHandlers(eventBus, eventStore);

export function registerRoutesV2(app: Express): void {
  // 健康检查
  app.get('/api/health', (_req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
      status: 'ok',
      version: '2.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      },
      node: process.version,
    });
  });

  // 登录/注册（无需认证）
  app.use('/api/users', createUserRoutes());

  // ========== 核心业务路由（Task-driven） ==========
  app.use('/api/tasks', authMiddleware, createTaskV2Routes(taskService));
  app.use('/api/executions', authMiddleware, createExecutionRoutes(executionService));
  app.use('/api/materials', authMiddleware, createMaterialV2Routes(materialService));
  app.use('/api/exceptions', authMiddleware, createExceptionRoutes(exceptionService));

  // ========== 辅助路由 ==========
  app.use('/api/dashboard', authMiddleware, createDashboardRoutes());
  app.use('/api/orders', authMiddleware, createOrderRoutes());
  app.use('/api/machines', authMiddleware, createMachineRoutes());
  app.use('/api/workers', authMiddleware, createWorkerRoutes());

  // ========== Task Flow API ==========
  app.use('/api/task-flow', authMiddleware, createTaskFlowRoutes(taskFlowEngine));

  // ========== 事件查询 ==========
  app.get('/api/events', authMiddleware, (_req, res) => {
    try {
      const events = eventStore.findRecent(50);
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log('[Routes] Task-driven architecture ready');
}
