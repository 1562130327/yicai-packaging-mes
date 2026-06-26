import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../../../infrastructure/database.js';

export function createOrderRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const orders = queryAll(`
        SELECT id, code, product_code, customer_name, priority, status, material_spec, quantity, due_date, created_at
        FROM orders ORDER BY
          CASE priority WHEN 'deadline' THEN 5 WHEN 'urgent' THEN 4 WHEN 'normal' THEN 3 WHEN 'attention' THEN 2 ELSE 0 END DESC,
          created_at DESC
      `);
      res.json({ success: true, data: orders.map(o => ({
        id: o.id, code: o.code, productCode: o.product_code, customerName: o.customer_name,
        priority: o.priority, status: o.status, materialSpec: o.material_spec,
        quantity: o.quantity, dueDate: o.due_date, createdAt: o.created_at,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/:id', (req: Request, res: Response) => {
    try {
      const order = queryOne(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
      if (!order) { res.status(404).json({ success: false, error: '订单不存在' }); return; }
      const steps = queryAll(`SELECT * FROM process_steps WHERE flow_id IN (SELECT id FROM process_flows WHERE order_id = ?) ORDER BY sequence`, [req.params.id]);
      res.json({ success: true, data: { ...order, steps } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/', (req: Request, res: Response) => {
    try {
      const { productCode, customerName, category, processType, priority, materialSpec, sheetSize, quantity, dueDate } = req.body;
      if (!productCode || !customerName) {
        res.status(400).json({ success: false, error: '产品编号和客户名称为必填' }); return;
      }
      const id = uuidv4();
      const code = `ORD-${String(Date.now()).slice(-6)}`;
      execute(`INSERT INTO orders (id, code, product_code, customer_name, category, process_type, priority, status, material_spec, sheet_size, quantity, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))`,
        [id, code, productCode, customerName, category || '', processType || '', priority || 'normal', materialSpec || '', sheetSize || '', quantity || 0, dueDate || '']);
      res.status(201).json({ success: true, data: { id, code } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.put('/:id', (req: Request, res: Response) => {
    try {
      const { productCode, customerName, category, processType, priority, materialSpec, sheetSize, quantity, dueDate, status } = req.body;
      execute(`UPDATE orders SET product_code=?, customer_name=?, category=?, process_type=?, priority=?, material_spec=?, sheet_size=?, quantity=?, due_date=?, status=?, updated_at=datetime('now','localtime') WHERE id=?`,
        [productCode, customerName, category, processType, priority, materialSpec, sheetSize, quantity, dueDate, status, req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.delete('/:id', (req: Request, res: Response) => {
    try {
      execute(`DELETE FROM orders WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
