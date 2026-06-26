import { Router, Request, Response } from 'express';
import { MaterialService } from '../../../application/MaterialService.js';

export function createMaterialV2Routes(materialService: MaterialService): Router {
  const router = Router();

  // POST /api/materials/inbound — 入库
  router.post('/inbound', async (req: Request, res: Response) => {
    try {
      const { batchNo, materialSpec, supplierName, color, quantity, unit, price } = req.body;
      if (!batchNo || !materialSpec || !quantity) {
        res.status(400).json({ success: false, error: '缺少必填字段' });
        return;
      }
      const batch = await materialService.inbound({ batchNo, materialSpec, supplierName, color, quantity, unit, price });
      res.status(201).json({ success: true, data: { id: batch.id, batchNo: batch.batchNo, remainingQty: batch.remainingQty } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/materials — 材料列表
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const batches = await materialService.listAll();
      res.json({ success: true, data: batches.map(b => ({
        id: b.id, batchNo: b.batchNo, materialSpec: b.materialSpec,
        remainingQty: b.remainingQty, unit: b.unit, supplierName: b.supplierName, color: b.color,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/materials/alerts — 库存预警
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 100;
      const batches = await materialService.getLowStock(threshold);
      res.json({ success: true, data: batches.map(b => ({
        id: b.id, batchNo: b.batchNo, materialSpec: b.materialSpec,
        remainingQty: b.remainingQty, unit: b.unit,
      })) });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/materials/consume — 扣减库存
  router.post('/consume', async (req: Request, res: Response) => {
    try {
      const { taskId, batchId, quantity } = req.body;
      if (!taskId || !batchId || !quantity) {
        res.status(400).json({ success: false, error: '缺少必填字段' });
        return;
      }
      await materialService.consume(taskId, batchId, quantity);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
}
