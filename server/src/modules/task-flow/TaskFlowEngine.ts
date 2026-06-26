import { EventBus } from '../../infrastructure/events/EventBus.js';
import { EventStore } from '../../infrastructure/events/EventStore.js';
import { TaskService } from '../../application/TaskService.js';
import { WorkflowRepository } from '../../domain/workflow/WorkflowRepository.js';
import { Workflow } from '../../domain/workflow/Workflow.js';
import { queryOne } from '../../infrastructure/database.js';

/**
 * 工艺模板（从 process_templates 表读取）
 * TODO: 后续可抽取为 ProcessTemplateRepository
 */
interface ProcessTemplate {
  id: string;
  name: string;
  steps: Array<{ type: string; name: string; sequence: number; requiredQty?: number }>;
}

/**
 * Task Flow 引擎
 *
 * 核心职责：当 Task 完成时，自动检查 Workflow 并创建下一个 Task
 *
 * 修复：改为通过 WorkflowRepository 加载聚合根，调用聚合根方法，然后通过仓储持久化
 *       不再直接用 queryOne/execute 操作 process_flows, process_steps, orders 表
 */
export class TaskFlowEngine {
  constructor(
    private taskService: TaskService,
    private eventBus: EventBus,
    private eventStore: EventStore,
    private workflowRepo: WorkflowRepository
  ) {}

  /**
   * 注册事件处理器（需显式调用启动）
   */
  start(): void {
    this.eventBus.on('task.completed', async (event) => {
      await this.handleTaskCompleted(event);
    });

    this.eventBus.on('task.created', async (event) => {
      await this.handleTaskCreated(event);
    });
  }

  /**
   * 处理任务完成：通过聚合根推进工作流
   */
  private async handleTaskCompleted(event: any): Promise<void> {
    const { taskId, orderId, stepId, quantity } = event.payload;
    console.log(`[TaskFlow] Task ${taskId} completed, checking for next step...`);

    const workflow = await this.workflowRepo.findByOrderId(orderId);
    if (!workflow) {
      console.log(`[TaskFlow] No workflow found for order ${orderId}`);
      return;
    }

    // 通过聚合根方法完成当前步骤
    workflow.completeStep(stepId, quantity);

    // 保存聚合根（WorkflowRepository.save 同时保存 workflow 和 steps）
    await this.workflowRepo.save(workflow);

    // 发布领域事件
    const domainEvents = workflow.pullEvents();
    if (domainEvents.length > 0) {
      this.eventStore.saveAll(domainEvents);
      await this.eventBus.publishAll(domainEvents);
    }

    // 检查工作流是否已完成
    if (workflow.isCompleted()) {
      console.log(`[TaskFlow] Workflow ${workflow.id} completed!`);
      return;
    }

    // 获取下一个待执行步骤并创建任务
    const nextStep = workflow.getNextStep();
    if (nextStep) {
      // 通过聚合根启动下一个步骤（状态流转为 running）
      workflow.startStep(nextStep.id);
      await this.workflowRepo.save(workflow);

      await this.taskService.createTask({
        stepId: nextStep.id,
        orderId,
        quantity: nextStep.requiredQty || quantity,
        priority: 3,
      });
      console.log(`[TaskFlow] Created next task for step: ${nextStep.name}`);
    }
  }

  /**
   * 处理任务创建：通过聚合根更新步骤状态
   */
  private async handleTaskCreated(event: any): Promise<void> {
    const { stepId, orderId } = event.payload;

    if (!orderId) return;

    const workflow = await this.workflowRepo.findByOrderId(orderId);
    if (!workflow) return;

    const step = workflow.steps.find(s => s.id === stepId);
    if (step && (step.status === 'waiting' || step.status === 'ready')) {
      workflow.startStep(stepId);
      await this.workflowRepo.save(workflow);
    }
  }

  /**
   * 启动工作流：从模板创建 Workflow 聚合根
   */
  async startWorkflow(orderId: string, templateName: string, quantity: number): Promise<void> {
    console.log(`[TaskFlow] Starting workflow for order ${orderId}`);

    const template = this.getTemplate(templateName);
    if (!template) throw new Error(`Template '${templateName}' not found`);

    // 通过聚合根工厂方法创建工作流
    const workflow = Workflow.create({
      id: crypto.randomUUID(),
      orderId,
      templateName,
      steps: template.steps.map(s => ({
        type: s.type,
        name: s.name,
        sequence: s.sequence,
        requiredQty: s.requiredQty || quantity,
      })),
    });

    // 通过仓储持久化聚合根
    await this.workflowRepo.save(workflow);

    // 为第一个步骤创建 Task
    const orderedSteps = workflow.getOrderedSteps();
    if (orderedSteps.length > 0) {
      const firstStep = orderedSteps[0];
      await this.taskService.createTask({
        stepId: firstStep.id,
        orderId,
        quantity,
        priority: 3,
      });
      console.log(`[TaskFlow] Created first task for step: ${firstStep.name}`);
    }

    // 发布领域事件
    const domainEvents = workflow.pullEvents();
    if (domainEvents.length > 0) {
      this.eventStore.saveAll(domainEvents);
      await this.eventBus.publishAll(domainEvents);
    }

    console.log(`[TaskFlow] Workflow started for order ${orderId}`);
  }

  /**
   * 获取工艺模板
   * TODO: 后续应替换为 ProcessTemplateRepository
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
}
