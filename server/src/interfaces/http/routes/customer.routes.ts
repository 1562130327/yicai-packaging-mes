import { Router, Request, Response } from 'express';
import { queryAll } from '../../../infrastructure/database.js';

export function createCustomerRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const customers = queryAll(`SELECT id, name, contact, phone, level, payment_cycle, address, notes FROM customers ORDER BY name`);
      res.json({ success: true, data: customers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
