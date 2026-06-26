import { Task, TaskStatus } from '../../domain/task/Task.js';
import { TaskRepository as ITaskRepository } from '../../domain/task/TaskRepository.js';
import { queryAll, queryOne, execute } from '../database.js';

/**
 * Task 仓储实现（SQLite）
 * 注意：数据库列名使用旧命名（process_step_id, assigned_worker）
 */
export class TaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    const row = queryOne(`SELECT * FROM tasks WHERE id = ?`, [id]);
    return row ? this.toDomain(row) : null;
  }

  async findByOrderId(orderId: string): Promise<Task[]> {
    const rows = queryAll(`SELECT * FROM tasks WHERE order_id = ? ORDER BY created_at`, [orderId]);
    return rows.map(r => this.toDomain(r));
  }

  async findByWorkerId(workerId: string): Promise<Task[]> {
    const rows = queryAll(
      `SELECT * FROM tasks WHERE assigned_worker = ? AND status NOT IN ('completed', 'cancelled') ORDER BY priority DESC, created_at`,
      [workerId]
    );
    return rows.map(r => this.toDomain(r));
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    const rows = queryAll(`SELECT * FROM tasks WHERE status = ? ORDER BY priority DESC`, [status]);
    return rows.map(r => this.toDomain(r));
  }

  async findAll(filters?: { status?: TaskStatus; workerId?: string; orderId?: string }): Promise<Task[]> {
    let sql = `SELECT * FROM tasks WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters?.workerId) {
      sql += ` AND assigned_worker = ?`;
      params.push(filters.workerId);
    }
    if (filters?.orderId) {
      sql += ` AND order_id = ?`;
      params.push(filters.orderId);
    }

    sql += ` ORDER BY priority DESC, created_at`;
    const rows = queryAll(sql, params);
    return rows.map(r => this.toDomain(r));
  }

  async save(task: Task): Promise<void> {
    const existing = queryOne(`SELECT id FROM tasks WHERE id = ?`, [task.id]);

    if (existing) {
      execute(
        `UPDATE tasks SET process_step_id=?, order_id=?, assigned_worker=?, machine_id=?, status=?, priority=?,
         quantity=?, completed_qty=?, estimated_hours=?, actual_hours=?,
         scheduled_at=?, started_at=?, completed_at=?, updated_at=?
         WHERE id=?`,
        [
          task.stepId, task.orderId, task.workerId, task.machineId,
          task.status, task.priority, task.quantity, task.completedQty,
          task.estimatedHours ?? 0, task.actualHours ?? 0,
          task.scheduledAt?.toISOString(), task.startedAt?.toISOString(),
          task.completedAt?.toISOString(), task.updatedAt.toISOString(),
          task.id,
        ]
      );
    } else {
      execute(
        `INSERT INTO tasks (id, process_step_id, order_id, process_type, assigned_worker, machine_id, status, priority,
         quantity, completed_qty, estimated_hours, actual_hours,
         scheduled_at, started_at, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id, task.stepId, task.orderId, 'unknown', task.workerId, task.machineId,
          task.status, task.priority, task.quantity, task.completedQty,
          task.estimatedHours ?? 0, task.actualHours ?? 0,
          task.scheduledAt?.toISOString(), task.startedAt?.toISOString(),
          task.completedAt?.toISOString(), task.createdAt.toISOString(), task.updatedAt.toISOString(),
        ]
      );
    }
  }

  async delete(id: string): Promise<void> {
    execute(`DELETE FROM tasks WHERE id = ?`, [id]);
  }

  async count(filters?: { status?: TaskStatus }): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM tasks WHERE 1=1`;
    const params: any[] = [];
    if (filters?.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    const result = queryOne(sql, params);
    return result?.count || 0;
  }

  /**
   * 数据库行 → 领域对象映射
   */
  private toDomain(row: any): Task {
    return Task.fromRow({
      ...row,
      step_id: row.process_step_id,
      worker_id: row.assigned_worker,
    });
  }
}
