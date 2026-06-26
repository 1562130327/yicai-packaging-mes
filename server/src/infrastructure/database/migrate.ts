import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 迁移记录表结构
 */
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );
`;

/**
 * 迁移定义
 */
interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

/**
 * 获取所有迁移
 */
function getMigrations(): Migration[] {
  return [
    {
      version: 1,
      name: 'create_domain_events',
      up: `
        CREATE TABLE IF NOT EXISTS domain_events (
          id TEXT PRIMARY KEY,
          aggregate_type TEXT NOT NULL,
          aggregate_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON domain_events(aggregate_type, aggregate_id);
        CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type);
      `,
      down: `DROP TABLE IF EXISTS domain_events;`,
    },
    {
      version: 2,
      name: 'add_quantity_due_date_to_orders',
      up: `-- 已手动添加 quantity 和 due_date 列，此迁移为空`,
      down: `-- SQLite 不支持 DROP COLUMN`,
    },
    {
      version: 3,
      name: 'create_schema_migrations',
      up: MIGRATION_TABLE,
      down: `DROP TABLE IF EXISTS schema_migrations;`,
    },
  ];
}

/**
 * 获取已应用的迁移版本
 */
function getAppliedVersions(db: Database.Database): number[] {
  try {
    const rows = db.prepare(`SELECT version FROM schema_migrations ORDER BY version`).all() as any[];
    return rows.map(r => r.version);
  } catch {
    return [];
  }
}

/**
 * 执行迁移
 */
export function runMigrations(dbPath: string): void {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // 确保迁移表存在
  db.exec(MIGRATION_TABLE);

  const applied = getAppliedVersions(db);
  const migrations = getMigrations();
  const pending = migrations.filter(m => !applied.includes(m.version));

  if (pending.length === 0) {
    console.log('[Migrations] Already up to date');
    db.close();
    return;
  }

  console.log(`[Migrations] Applying ${pending.length} migration(s)...`);

  for (const migration of pending) {
    try {
      db.exec(migration.up);
      db.prepare(`INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, datetime('now','localtime'))`)
        .run(migration.version, migration.name);
      console.log(`[Migrations] ✓ ${migration.version}: ${migration.name}`);
    } catch (error: any) {
      console.error(`[Migrations] ✗ ${migration.version}: ${migration.name} - ${error.message}`);
      db.close();
      throw error;
    }
  }

  console.log(`[Migrations] Done. Applied ${pending.length} migration(s)`);
  db.close();
}

/**
 * 回滚最后一个迁移
 */
export function rollbackMigration(dbPath: string): void {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const last = db.prepare(`SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1`).get() as any;
  if (!last) {
    console.log('[Migrations] Nothing to rollback');
    db.close();
    return;
  }

  const migrations = getMigrations();
  const migration = migrations.find(m => m.version === last.version);
  if (!migration) {
    console.error(`[Migrations] Migration ${last.version} not found`);
    db.close();
    return;
  }

  try {
    db.exec(migration.down);
    db.prepare(`DELETE FROM schema_migrations WHERE version = ?`).run(last.version);
    console.log(`[Migrations] Rolled back ${last.version}: ${last.name}`);
  } catch (error: any) {
    console.error(`[Migrations] Rollback failed: ${error.message}`);
  }

  db.close();
}

/**
 * 查看迁移状态
 */
export function migrationStatus(dbPath: string): void {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const applied = getAppliedVersions(db);
  const migrations = getMigrations();

  console.log('[Migrations] Status:');
  for (const m of migrations) {
    const status = applied.includes(m.version) ? '✓ applied' : '○ pending';
    console.log(`  ${m.version}: ${m.name} - ${status}`);
  }

  db.close();
}
