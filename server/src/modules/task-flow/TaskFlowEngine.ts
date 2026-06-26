import { EventBus } from '../../infrastructure/events/EventBus.js';
import { EventStore } from '../../infrastructure/events/EventStore.js';
import { TaskService } from '../../application/TaskService.js';
import { queryOne, execute } from '../../infrastructure/database.js';

/**
 * Task Flow 引擎
 *
 * 核心职责：当 Task 完成时，自动检查 Workflow 并创建下一个 Task
 */
export class TaskFlowEngine {
  constructor(
    private taskService: TaskService,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    this.eventBus.on('task.completed', async (event) => {
      await this.handleTaskCompleted(event);
    });

    this.eventBus.on('task.created', async (event) => {
      await this.handleTaskCreated(event);
    });
  }

  private async handleTaskCompleted(event: any): Promise<void> {
    const { taskId, orderId, stepId, quantity } = event.payload;
    console.log(`[TaskFlow] Task ${taskId} completed, checking for next step...`);

    const workflow = queryOne(
      `SELECT pf.* FROM process_flows pf JOIN process_steps ps ON ps.flow_id = pf.id WHERE ps.id = ?`,
      [stepId]
    );
    if (!workflow) { console.log(`[TaskFlow] No workflow found for step ${stepId}`); return; }

    execute(`UPDATE process_steps SET status = 'done', completed_qty = ?, completed_at = datetime('now','localtime') WHERE id = ?`, [quantity, stepId]);

    const currentStep = queryOne(`SELECT sequence FROM process_steps WHERE id = ?`, [stepId]);
    if (!currentStep) return;

    const nextStep = queryOne(`SELECT * FROM process_steps WHERE flow_id = ? AND sequence > ? ORDER BY sequence LIMIT 1`, [workflow.id, currentStep.sequence]);

    if (nextStep) {
      execute(`UPDATE process_steps SET status = 'ready' WHERE id = ?`, [nextStep.id]);
      await this.taskService.createTask({ stepId: nextStep.id, orderId, quantity: nextStep.required_qty || quantity, priority: 3 });
      console.log(`[TaskFlow] Created next task for step: ${nextStep.name}`);
    } else {
      execute(`UPDATE process_flows SET status = 'completed' WHERE id = ?`, [workflow.id]);
      execute(`UPDATE orders SET status = 'completed', updated_at = datetime('now','localtime') WHERE id = ?`, [orderId]);
      console.log(`[TaskFlow] Workflow ${workflow.id} completed!`);
    }
  }

  private async handleTaskCreated(event: any): Promise<void> {
    const { stepId } = event.payload;
    execute(`UPDATE process_steps SET status = 'ready' WHERE id = ?`, [stepId]);
  }

  async startWorkflow(orderId: string, templateName: string, quantity: number): Promise<void> {
    console.log(`[TaskFlow] Starting workflow for order ${orderId}`);

    const template = queryOne(`SELECT * FROM process_templates WHERE name = ?`, [templateName]);
    if (!template) throw new Error(`Template '${templateName}' not found`);

    const steps = JSON.parse(template.steps);
    const workflowId = crypto.randomUUID();

    execute(`INSERT INTO process_flows (id, order_id, status, created_at) VALUES (?, ?, 'in_progress', datetime('now','localtime'))`, [workflowId, orderId]);

    for (const step of steps) {
      const stepId = crypto.randomUUID();
      execute(`INSERT INTO process_steps (id, flow_id, type, name, sequence, status, required_qty) VALUES (?, ?, ?, ?, ?, 'waiting', ?)`, [stepId, workflowId, step.type, step.name, step.sequence, quantity]);
    }

    const firstStep = queryOne(`SELECT * FROM process_steps WHERE flow_id = ? ORDER BY sequence LIMIT 1`, [workflowId]);
    if (firstStep) {
      await this.taskService.createTask({ stepId: firstStep.id, orderId, quantity, priority: 3 });
      console.log(`[TaskFlow] Created first task for step: ${firstStep.name}`);
    }

    execute(`UPDATE orders SET status = 'in_progress', updated_at = datetime('now','localtime') WHERE id = ?`, [orderId]);
    console.log(`[TaskFlow] Workflow started for order ${orderId}`);
  }
}
