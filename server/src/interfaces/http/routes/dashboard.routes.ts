import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../../../infrastructure/database.js';

export function createDashboardRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const activeOrders = queryOne(`SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('completed', 'cancelled')`);
      const machines = queryAll(`SELECT id, code, name, type, status FROM machines ORDER BY code`);
      const workers = queryAll(`SELECT id, name, role, status FROM workers LIMIT 10`);
      const pipeline = queryAll(`SELECT ps.type, COUNT(*) as count FROM process_steps ps JOIN process_flows pf ON ps.flow_id = pf.id WHERE ps.status = 'running' GROUP BY ps.type`);
      const inventoryAlerts = queryOne(`SELECT COUNT(*) as count FROM inventory_batches WHERE remaining_qty < 100`);
      const criticalInventory = queryOne(`SELECT COUNT(*) as count FROM inventory_batches WHERE remaining_qty < 50`);
      const anomalyCount = queryOne(`SELECT COUNT(*) as count FROM anomaly_events`);

      const orders = queryAll(`
        SELECT id, code, customer_name, priority, status, material_spec
        FROM orders WHERE status NOT IN ('completed', 'cancelled')
        ORDER BY CASE priority WHEN 'deadline' THEN 5 WHEN 'urgent' THEN 4 WHEN 'normal' THEN 3 ELSE 0 END DESC
        LIMIT 10
      `);

      const runningMachines = machines.filter((m: any) => m.status === 'running').length;

      const data = {
        kpi: {
          activeOrders: activeOrders?.count || 0,
          completedToday: 0,
          machineUtilization: machines.length > 0 ? Math.round((runningMachines / machines.length) * 100) + '%' : '0%',
          personnelOnDuty: workers.length,
          inventoryAlerts: inventoryAlerts?.count || 0,
          criticalInventory: criticalInventory?.count || 0,
          anomalyCount: anomalyCount?.count || 0,
        },
        orders: orders.map((o: any) => ({
          id: o.id, code: o.code, customerName: o.customer_name, priority: o.priority,
          status: o.status, materialSpec: o.material_spec,
        })),
        machines: machines.map((m: any) => ({
          id: m.id, code: m.code, name: m.name, type: m.type, status: m.status,
        })),
        workers: workers.map((w: any) => ({
          id: w.id, name: w.name, role: w.role, team: '-', status: w.status || 'active',
        })),
        pipeline: pipeline.map((p: any) => ({ stage: p.type, count: p.count })),
        inventoryAlerts: inventoryAlerts?.count || 0,
      };

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
