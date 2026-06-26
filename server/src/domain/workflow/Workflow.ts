import { AggregateRoot } from '../shared/AggregateRoot.js';
import { DomainEvent } from '../shared/DomainEvent.js';
import { WorkflowStep, StepStatus } from './WorkflowStep.js';

/**
 * Workflow 状态枚举
 */
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'paused';

/**
 * Workflow 领域事件
 */
export class WorkflowCreated extends DomainEvent {
  constructor(workflowId: string, orderId: string, templateName: string) {
    super({
      eventType: 'workflow.created',
      aggregateType: 'workflow',
      aggregateId: workflowId,
      payload: { orderId, templateName },
    });
  }
}

export class WorkflowStepStarted extends DomainEvent {
  constructor(workflowId: string, stepId: string, stepType: string) {
    super({
      eventType: 'workflow.step_started',
      aggregateType: 'workflow',
      aggregateId: workflowId,
      payload: { stepId, stepType },
    });
  }
}

export class WorkflowStepCompleted extends DomainEvent {
  constructor(workflowId: string, stepId: string, stepType: string, outputQty: number) {
    super({
      eventType: 'workflow.step_completed',
      aggregateType: 'workflow',
      aggregateId: workflowId,
      payload: { stepId, stepType, outputQty },
    });
  }
}

export class WorkflowCompleted extends DomainEvent {
  constructor(workflowId: string, orderId: string) {
    super({
      eventType: 'workflow.completed',
      aggregateType: 'workflow',
      aggregateId: workflowId,
      payload: { orderId },
    });
  }
}

/**
 * Workflow 聚合根
 *
 * 管理工序流程：从模板展开为具体的 WorkflowStep
 * 每个 Order 生成一个 Workflow
 * 每个 Workflow 包含多个 WorkflowStep（按 sequence 排序）
 */
export class Workflow extends AggregateRoot {
  private _orderId: string;
  private _templateName: string;
  private _status: WorkflowStatus;
  private _steps: WorkflowStep[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    id: string;
    orderId: string;
    templateName: string;
    status: WorkflowStatus;
    steps: WorkflowStep[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._orderId = params.orderId;
    this._templateName = params.templateName;
    this._status = params.status;
    this._steps = params.steps;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ========== Getters ==========
  get orderId(): string { return this._orderId; }
  get templateName(): string { return this._templateName; }
  get status(): WorkflowStatus { return this._status; }
  get steps(): WorkflowStep[] { return [...this._steps]; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * 获取按顺序排列的步骤
   */
  getOrderedSteps(): WorkflowStep[] {
    return [...this._steps].sort((a, b) => a.sequence - b.sequence);
  }

  /**
   * 获取当前正在执行的步骤
   */
  getCurrentStep(): WorkflowStep | null {
    return this._steps.find(s => s.status === 'running') ?? null;
  }

  /**
   * 获取下一个待执行的步骤
   */
  getNextStep(): WorkflowStep | null {
    const ordered = this.getOrderedSteps();
    for (const step of ordered) {
      if (step.status === 'waiting' || step.status === 'ready') {
        return step;
      }
    }
    return null;
  }

  /**
   * 检查工作流是否已完成
   */
  isCompleted(): boolean {
    return this._steps.every(s => s.status === 'done');
  }

  // ========== 业务操作 ==========

  /**
   * 开始某个步骤
   */
  startStep(stepId: string): void {
    const step = this._steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in workflow`);

    if (this._status === 'pending') {
      this._status = 'in_progress';
    }

    step.start();
    this._updatedAt = new Date();
    this.addEvent(new WorkflowStepStarted(this.id, step.id, step.type));
  }

  /**
   * 完成某个步骤
   */
  completeStep(stepId: string, outputQty: number): void {
    const step = this._steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in workflow`);

    step.complete(outputQty);
    this._updatedAt = new Date();
    this.addEvent(new WorkflowStepCompleted(this.id, step.id, step.type, outputQty));

    // 检查工作流是否全部完成
    if (this.isCompleted()) {
      this._status = 'completed';
      this.addEvent(new WorkflowCompleted(this.id, this._orderId));
    }
  }

  /**
   * 暂停某个步骤
   */
  pauseStep(stepId: string): void {
    const step = this._steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in workflow`);
    step.pause();
    this._updatedAt = new Date();
  }

  // ========== 工厂方法 ==========

  /**
   * 从模板创建工作流
   */
  static create(params: {
    id: string;
    orderId: string;
    templateName: string;
    steps: Array<{ type: string; name: string; sequence: number; requiredQty: number }>;
  }): Workflow {
    const workflowSteps = params.steps.map(s =>
      WorkflowStep.create({
        id: crypto.randomUUID(),
        workflowId: params.id,
        type: s.type,
        name: s.name,
        sequence: s.sequence,
        requiredQty: s.requiredQty,
      })
    );

    const workflow = new Workflow({
      id: params.id,
      orderId: params.orderId,
      templateName: params.templateName,
      status: 'pending',
      steps: workflowSteps,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    workflow.addEvent(new WorkflowCreated(params.id, params.orderId, params.templateName));
    return workflow;
  }

  /**
   * 从数据库行重建
   */
  static fromRow(row: any, steps: WorkflowStep[]): Workflow {
    return new Workflow({
      id: row.id,
      orderId: row.order_id,
      templateName: row.template_name || '',
      status: row.status,
      steps,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
