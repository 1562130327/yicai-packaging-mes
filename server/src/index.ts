import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './infrastructure/database.js';
import { registerRoutes } from './interfaces/http/routes/index.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const DB_PATH = process.env.DATABASE_PATH || 'D:/溢彩/data/production.db';

async function main() {
  console.log('[溢彩包装] Starting server...');

  // 初始化数据库（better-sqlite3，真正持久化）
  initDatabase(DB_PATH);

  // 创建 Express 应用
  const app = express();

  // 中间件
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  // 注册 API 路由
  registerRoutes(app);

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`[溢彩包装] Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[溢彩包装] Failed to start:', err);
  process.exit(1);
});
