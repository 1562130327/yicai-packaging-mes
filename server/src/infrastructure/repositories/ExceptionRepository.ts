import { Exception } from '../../domain/exception/Exception.js';
import { ExceptionRepository as IExceptionRepository } from '../../domain/exception/ExceptionRepository.js';
import { queryAll, queryOne, execute } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export class ExceptionRepository implements IExceptionRepository {
  async findById(id: string): Promise<Exception | null> {
    const row = queryOne(`SELECT * FROM anomaly_events WHERE id = ?`, [id]);
    return row ? Exception.fromRow(row) : null;
  }

  async findAll(): Promise<Exception[]> {
    const rows = queryAll(`SELECT * FROM anomaly_events ORDER BY detected_at DESC`);
    return rows.map(r => Exception.fromRow(r));
  }

  async findOpen(): Promise<Exception[]> {
    const rows = queryAll(`SELECT * FROM anomaly_events WHERE resolved_at IS NULL ORDER BY detected_at DESC`);
    return rows.map(r => Exception.fromRow(r));
  }

  async save(exception: Exception): Promise<void> {
    const existing = queryOne(`SELECT id FROM anomaly_events WHERE id = ?`, [exception.id]);
    if (existing) {
      execute(
        `UPDATE anomaly_events SET resolved_at=?, resolution=? WHERE id=?`,
        [exception.resolvedAt?.toISOString(), exception.resolution, exception.id]
      );
    } else {
      execute(
        `INSERT INTO anomaly_events (id, order_id, process_step_id, type, description, severity, detected_at, resolved_at, resolution, trigger_supplement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [exception.id, exception.taskId, '', exception.type, exception.description, exception.severity, exception.detectedAt.toISOString(), exception.resolvedAt?.toISOString(), exception.resolution]
      );
    }
  }
}
