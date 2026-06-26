import { Execution } from '../../domain/execution/Execution.js';
import { ExecutionRepository as IExecutionRepository } from '../../domain/execution/ExecutionRepository.js';
import { queryAll, queryOne, execute } from '../database.js';

export class ExecutionRepository implements IExecutionRepository {
  async findById(id: string): Promise<Execution | null> {
    const row = queryOne(`SELECT * FROM completion_records WHERE id = ?`, [id]);
    return row ? Execution.fromRow(row) : null;
  }

  async findByTaskId(taskId: string): Promise<Execution[]> {
    const rows = queryAll(`SELECT * FROM completion_records WHERE step_id = ? ORDER BY timestamp`, [taskId]);
    return rows.map(r => Execution.fromRow(r));
  }

  async save(execution: Execution): Promise<void> {
    execute(
      `INSERT INTO completion_records (id, step_id, worker, quantity, defect_qty, notes, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [execution.id, execution.taskId, execution.workerId, execution.quantity, execution.defectQty, execution.notes, execution.recordedAt.toISOString()]
    );
  }
}
