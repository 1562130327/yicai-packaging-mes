import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, execute } from '../../../infrastructure/database.js';

export function createInventoryRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const inventory = queryAll(`
        SELECT ib.id, ib.batch_no, ib.material_spec, ib.remaining_qty, ib.unit,
               ib.supplier_name, ib.color, ib.batch_width, ib.price
        FROM inventory_batches ib ORDER BY ib.material_spec
      `);
      res.json({ success: true, data: inventory.map(i => ({
        id: i.id, batchNo: i.batch_no, materialSpec: i.material_spec,
        remainingQty: i.remaining_qty, unit: i.unit, supplierName: i.supplier_name,
        color: i.color, batchWidth: i.batch_width, price: i.price,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/alerts', (_req: Request, res: Response) => {
    try {
      const alerts = queryAll(`
        SELECT ib.id, ib.batch_no, ib.material_spec, ib.remaining_qty, ib.unit
        FROM inventory_batches ib WHERE ib.remaining_qty < 100 ORDER BY ib.remaining_qty ASC
      `);
      res.json({ success: true, data: alerts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/', (req: Request, res: Response) => {
    try {
      const { batchNo, materialSpec, supplierName, color, remainingQty, unit, price } = req.body;
      if (!batchNo || !materialSpec) {
        res.status(400).json({ success: false, error: '批次号和材料规格为必填' }); return;
      }
      const id = uuidv4();
      execute(`INSERT INTO inventory_batches (id, batch_no, material_spec, remaining_qty, unit, supplier_name, color, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))`,
        [id, batchNo, materialSpec, remainingQty || 0, unit || '张', supplierName || '', color || '', price || 0]);
      res.status(201).json({ success: true, data: { id, batchNo } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
