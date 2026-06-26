import { Workflow } from '../../domain/workflow/Workflow.js';
import { WorkflowStep } from '../../domain/workflow/WorkflowStep.js';
import { WorkflowRepository as IWorkflowRepository } from '../../domain/workflow/WorkflowRepository.js';
import { queryOne, queryAll, execute } from '../database.js';

/**
 * Workflow 仓储实现（SQLite）
 */
export class WorkflowRepository implements IWorkflowRepository {
  async findById(id: string): Promise<Workflow | null> {
    const row = queryOne(`SELECT * FROM process_flows WHERE id = ?`, [id]);
    if (!row) return null;

    const stepsRows = queryAll(
      `SELECT * FROM process_steps WHERE flow_id = ? ORDER BY sequence`,
      [id]
    );
    const steps = stepsRows.map(r => WorkflowStep.fromRow(r));

    return Workflow.fromRow(row, steps);
  }

  async findByOrderId(orderId: string): Promise<Workflow | null> {
    const row = queryOne(`SELECT * FROM process_flows WHERE order_id = ?`, [orderId]);
    if (!row) return null;

    const stepsRows = queryAll(
      `SELECT * FROM process_steps WHERE flow_id = ? ORDER BY sequence`,
      [row.id]
    );
    const steps = stepsRows.map(r => WorkflowStep.fromRow(r));

    return Workflow.fromRow(row, steps);
  }

  async save(workflow: Workflow): Promise<void> {
    // 保存 workflow 主表
    const existing = queryOne(`SELECT id FROM process_flows WHERE id = ?`, [workflow.id]);
    if (existing) {
      execute(
        `UPDATE process_flows SET order_id=?, status=?, updated_at=datetime('now','localtime') WHERE id=?`,
        [workflow.orderId, workflow.status, workflow.id]
      );
    } else {
      execute(
        `INSERT INTO process_flows (id, order_id, status, created_at) VALUES (?, ?, ?, datetime('now','localtime'))`,
        [workflow.id, workflow.orderId, workflow.status]
      );
    }

    // 保存每个步骤
    for (const step of workflow.steps) {
      const stepExisting = queryOne(`SELECT id FROM process_steps WHERE id = ?`, [step.id]);
      if (stepExisting) {
        execute(
          `UPDATE process_steps SET status=?, completed_qty=?, defect_qty=?, started_at=?, completed_at=? WHERE id=?`,
          [step.status, step.completedQty, step.defectQty, step.startedAt?.toISOString(), step.completedAt?.toISOString(), step.id]
        );
      } else {
        execute(
          `INSERT INTO process_steps (id, flow_id, type, name, sequence, status, required_qty, completed_qty, defect_qty, started_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [step.id, step.workflowId, step.type, step.name, step.sequence, step.status, step.requiredQty, step.completedQty, step.defectQty, step.startedAt?.toISOString(), step.completedAt?.toISOString()]
        );
      }
    }
  }
}
