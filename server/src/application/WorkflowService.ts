import { Workflow } from '../domain/workflow/Workflow.js';
import { WorkflowRepository } from '../domain/workflow/WorkflowRepository.js';
import { TaskService } from './TaskService.js';
import { EventBus } from '../infrastructure/events/EventBus.js';
import { EventStore } from '../infrastructure/events/EventStore.js';
import { queryOne, queryAll } from '../infrastructure/database.js';

/**
 * 工艺模板（从 process_templates 表读取）
 */
interface ProcessTemplate {
  id: string;
  name: string;
  steps: Array<{ type: string; name: string; sequence: number }>;
}

/**
 * Workflow 应用服务
 * 编排 Workflow 领域逻辑
 */
export class WorkflowService {
  constructor(
    private workflowRepo: WorkflowRepository,
    private taskService: TaskService,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {}

  /**
   * 为订单创建工作流（从模板展开）
   */
  async createWorkflow(orderId: string, templateName: string, orderQuantity: number): Promise<Workflow> {
    // 从模板表获取工艺步骤
    const template = this.getTemplate(templateName);
    if (!template) throw new Error(`Template '${templateName}' not found`);

    const workflow = Workflow.create({
      id: crypto.randomUUID(),
      orderId,
      templateName,
      steps: template.steps.map(s => ({
        ...s,
        requiredQty: orderQuantity,
      })),
    });

    await this.workflowRepo.save(workflow);

    // 为每个步骤创建 Task
    for (const step of workflow.steps) {
      await this.taskService.createTask({
        stepId: step.id,
        orderId,
        quantity: step.requiredQty,
        priority: 3,
      });
    }

    const events = workflow.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);

    return workflow;
  }

  /**
   * 开始某个步骤
   */
  async startStep(workflowId: string, stepId: string): Promise<void> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    workflow.startStep(stepId);
    await this.workflowRepo.save(workflow);

    const events = workflow.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);
  }

  /**
   * 完成某个步骤
   */
  async completeStep(workflowId: string, stepId: string, outputQty: number): Promise<void> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    workflow.completeStep(stepId, outputQty);
    await this.workflowRepo.save(workflow);

    const events = workflow.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);
  }

  /**
   * 获取订单的工作流
   */
  async getWorkflowByOrder(orderId: string): Promise<Workflow | null> {
    return this.workflowRepo.findByOrderId(orderId);
  }

  /**
   * 获取工作流
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    return this.workflowRepo.findById(workflowId);
  }

  /**
   * 获取工艺模板
   */
  private getTemplate(name: string): ProcessTemplate | null {
    const row = queryOne(`SELECT * FROM process_templates WHERE name = ?`, [name]);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      steps: JSON.parse(row.steps),
    };
  }

  /**
   * 获取所有模板
   */
  getTemplates(): ProcessTemplate[] {
    const rows = queryAll(`SELECT * FROM process_templates`);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      steps: JSON.parse(r.steps),
    }));
  }
}
