import { Router, Request, Response } from 'express';
import { queryAll } from '../../../infrastructure/database.js';

export function createMaterialRoutes(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    try {
      const materials = queryAll(`SELECT * FROM materials ORDER BY spec`);
      res.json({ success: true, data: materials });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
