import Database from 'better-sqlite3';
import path from 'node:path';

let db: Database.Database | null = null;

export function initDatabase(dbPath: string): Database.Database {
  if (db) return db;

  db = new Database(dbPath);

  // 启用 WAL 模式，提高并发性能
  db.pragma('journal_mode = WAL');
  // 暂时禁用外键约束（兼容旧数据）
  db.pragma('foreign_keys = OFF');

  console.log(`[DB] Connected to: ${dbPath}`);
  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

// 通用查询：返回对象数组
export function queryAll(sql: string, params: any[] = []): any[] {
  return getDb().prepare(sql).all(...params);
}

// 通用查询：返回单行
export function queryOne(sql: string, params: any[] = []): any | undefined {
  return getDb().prepare(sql).get(...params);
}

// 通用执行：INSERT/UPDATE/DELETE
export function execute(sql: string, params: any[] = []): void {
  getDb().prepare(sql).run(...params);
}

// 通用执行并返回信息
export function executeRun(sql: string, params: any[] = []): Database.RunResult {
  return getDb().prepare(sql).run(...params);
}
