import { Express } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { createDashboardRoutes } from './dashboard.routes.js';
import { createOrderRoutes } from './order.routes.js';
import { createMachineRoutes } from './machine.routes.js';
import { createWorkerRoutes } from './worker.routes.js';
import { createInventoryRoutes } from './inventory.routes.js';
import { createCustomerRoutes } from './customer.routes.js';
import { createUserRoutes } from './user.routes.js';
import { createProcessRoutes } from './process.routes.js';
import { createFeedbackRoutes } from './feedback.routes.js';
import { createReportRoutes } from './report.routes.js';
import { createTraceRoutes } from './trace.routes.js';
import { createMaterialRoutes } from './material.routes.js';
import { createWorkersAdminRoutes } from './workers-admin.routes.js';

export async function registerRoutes(app: Express): Promise<void> {
  // 健康检查（无需认证）
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 登录/注册（无需认证）
  app.use('/api/users', createUserRoutes());

  // 以下路由需要认证
  app.use('/api/dashboard', authMiddleware, createDashboardRoutes());
  app.use('/api/orders', authMiddleware, createOrderRoutes());
  app.use('/api/machines', authMiddleware, createMachineRoutes());
  app.use('/api/workers', authMiddleware, createWorkerRoutes());
  app.use('/api/workers-admin', authMiddleware, requireRole('admin'), createWorkersAdminRoutes());
  app.use('/api/inventory', authMiddleware, createInventoryRoutes());
  app.use('/api/customers', authMiddleware, createCustomerRoutes());
  app.use('/api/processes', authMiddleware, createProcessRoutes());
  app.use('/api/feedback', authMiddleware, createFeedbackRoutes());
  app.use('/api/reports', authMiddleware, requireRole('admin', 'merchandiser'), createReportRoutes());
  app.use('/api/traces', authMiddleware, createTraceRoutes());
  app.use('/api/materials', authMiddleware, createMaterialRoutes());

  console.log('[Routes] All API routes registered with auth');
}
