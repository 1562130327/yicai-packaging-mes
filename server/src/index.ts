import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './infrastructure/database.js';
import { runMigrations } from './infrastructure/database/migrate.js';
import { registerRoutesV2 } from './interfaces/http/routes/index-v2.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const DB_PATH = process.env.DATABASE_PATH || 'D:/溢彩/data/production.db';

async function main() {
  console.log('[溢彩包装] Starting server (v2.0 - DDD Architecture)...');

  // 初始化数据库
  initDatabase(DB_PATH);

  // 运行迁移
  runMigrations(DB_PATH);

  // 创建 Express 应用
  const app = express();

  // 中间件
  app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  // 请求日志
  app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });

  // 注册路由
  registerRoutesV2(app);

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`[溢彩包装] Server running at http://localhost:${PORT}`);
    console.log(`[溢彩包装] Architecture: Domain-Driven Design + Event-Driven`);
    console.log(`[溢彩包装] Database: ${DB_PATH}`);
  });
}

main().catch((err) => {
  console.error('[溢彩包装] Failed to start:', err);
  process.exit(1);
});
