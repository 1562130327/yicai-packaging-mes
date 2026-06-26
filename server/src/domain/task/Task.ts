import { AggregateRoot } from '../shared/AggregateRoot.js';
import { DomainEvent } from '../shared/DomainEvent.js';

/**
 * Task 状态枚举
 */
export type TaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'paused' | 'cancelled';

/**
 * Task 领域事件
 */
export class TaskCreated extends DomainEvent {
  constructor(taskId: string, stepId: string, orderId: string, quantity: number) {
    super({
      eventType: 'task.created',
      aggregateType: 'task',
      aggregateId: taskId,
      payload: { stepId, orderId, quantity },
    });
  }
}

export class TaskAssigned extends DomainEvent {
  constructor(taskId: string, workerId: string, machineId: string) {
    super({
      eventType: 'task.assigned',
      aggregateType: 'task',
      aggregateId: taskId,
      payload: { workerId, machineId },
    });
  }
}

export class TaskStarted extends DomainEvent {
  constructor(taskId: string, workerId: string) {
    super({
      eventType: 'task.started',
      aggregateType: 'task',
      aggregateId: taskId,
      payload: { workerId },
    });
  }
}

export class TaskCompleted extends DomainEvent {
  constructor(taskId: string, orderId: string, stepId: string, quantity: number, defectQty: number) {
    super({
      eventType: 'task.completed',
      aggregateType: 'task',
      aggregateId: taskId,
      payload: { orderId, stepId, quantity, defectQty },
    });
  }
}

export class TaskPaused extends DomainEvent {
  constructor(taskId: string, reason: string) {
    super({
      eventType: 'task.paused',
      aggregateType: 'task',
      aggregateId: taskId,
      payload: { reason },
    });
  }
}

export class TaskCancelled extends DomainEvent {
  constructor(taskId: string, reason: string) {
    super({
      eventType: 'task.cancelled',
      aggregateType: 'task',
      aggregateId: taskId,
      payload: { reason },
    });
  }
}

/**
 * Task 聚合根
 *
 * 状态机：
 * pending → assigned → running → completed
 *                    ↗ running ↗
 *              assigned   paused
 *
 * 任何时候都可以: cancel → cancelled
 */
export class Task extends AggregateRoot {
  private _stepId: string;
  private _orderId: string;
  private _workerId: string | null;
  private _machineId: string | null;
  private _status: TaskStatus;
  private _priority: number;
  private _quantity: number;
  private _completedQty: number;
  private _estimatedHours: number | null;
  private _actualHours: number | null;
  private _scheduledAt: Date | null;
  private _startedAt: Date | null;
  private _completedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    id: string;
    stepId: string;
    orderId: string;
    workerId?: string | null;
    machineId?: string | null;
    status: TaskStatus;
    priority: number;
    quantity: number;
    completedQty?: number;
    estimatedHours?: number | null;
    actualHours?: number | null;
    scheduledAt?: Date | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._stepId = params.stepId;
    this._orderId = params.orderId;
    this._workerId = params.workerId ?? null;
    this._machineId = params.machineId ?? null;
    this._status = params.status;
    this._priority = params.priority;
    this._quantity = params.quantity;
    this._completedQty = params.completedQty ?? 0;
    this._estimatedHours = params.estimatedHours ?? null;
    this._actualHours = params.actualHours ?? null;
    this._scheduledAt = params.scheduledAt ?? null;
    this._startedAt = params.startedAt ?? null;
    this._completedAt = params.completedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ========== Getters ==========
  get stepId(): string { return this._stepId; }
  get orderId(): string { return this._orderId; }
  get workerId(): string | null { return this._workerId; }
  get machineId(): string | null { return this._machineId; }
  get status(): TaskStatus { return this._status; }
  get priority(): number { return this._priority; }
  get quantity(): number { return this._quantity; }
  get completedQty(): number { return this._completedQty; }
  get estimatedHours(): number | null { return this._estimatedHours; }
  get actualHours(): number | null { return this._actualHours; }
  get scheduledAt(): Date | null { return this._scheduledAt; }
  get startedAt(): Date | null { return this._startedAt; }
  get completedAt(): Date | null { return this._completedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // ========== 业务操作（状态机） ==========

  /**
   * 分配任务给工人和机器
   */
  assign(workerId: string, machineId: string): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot assign task in status '${this._status}', must be 'pending'`);
    }
    this._workerId = workerId;
    this._machineId = machineId;
    this._status = 'assigned';
    this._updatedAt = new Date();
    this.addEvent(new TaskAssigned(this.id, workerId, machineId));
  }

  /**
   * 开始执行任务
   */
  start(): void {
    if (this._status !== 'assigned') {
      throw new Error(`Cannot start task in status '${this._status}', must be 'assigned'`);
    }
    this._status = 'running';
    this._startedAt = new Date();
    this._updatedAt = new Date();
    this.addEvent(new TaskStarted(this.id, this._workerId!));
  }

  /**
   * 完成任务
   */
  complete(quantity: number, defectQty: number = 0): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot complete task in status '${this._status}', must be 'running'`);
    }
    if (quantity < 0) throw new Error('Quantity cannot be negative');
    if (defectQty < 0) throw new Error('Defect quantity cannot be negative');
    if (defectQty > quantity) throw new Error('Defect quantity cannot exceed total quantity');

    this._completedQty = quantity;
    this._status = 'completed';
    this._completedAt = new Date();
    this._updatedAt = new Date();
    this.addEvent(new TaskCompleted(this.id, this._orderId, this._stepId, quantity, defectQty));
  }

  /**
   * 暂停任务
   */
  pause(reason: string): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot pause task in status '${this._status}', must be 'running'`);
    }
    this._status = 'paused';
    this._updatedAt = new Date();
    this.addEvent(new TaskPaused(this.id, reason));
  }

  /**
   * 恢复暂停的任务
   */
  resume(): void {
    if (this._status !== 'paused') {
      throw new Error(`Cannot resume task in status '${this._status}', must be 'paused'`);
    }
    this._status = 'running';
    this._updatedAt = new Date();
    this.addEvent(new TaskStarted(this.id, this._workerId!));
  }

  /**
   * 取消任务
   */
  cancel(reason: string): void {
    if (this._status === 'completed') {
      throw new Error('Cannot cancel completed task');
    }
    if (this._status === 'cancelled') {
      throw new Error('Task already cancelled');
    }
    this._status = 'cancelled';
    this._updatedAt = new Date();
    this.addEvent(new TaskCancelled(this.id, reason));
  }

  // ========== 工厂方法 ==========

  /**
   * 创建新任务
   */
  static create(params: {
    id: string;
    stepId: string;
    orderId: string;
    quantity: number;
    priority?: number;
    estimatedHours?: number;
  }): Task {
    const task = new Task({
      id: params.id,
      stepId: params.stepId,
      orderId: params.orderId,
      status: 'pending',
      priority: params.priority ?? 3,
      quantity: params.quantity,
      estimatedHours: params.estimatedHours ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    task.addEvent(new TaskCreated(params.id, params.stepId, params.orderId, params.quantity));
    return task;
  }

  /**
   * 从数据库行重建
   */
  static fromRow(row: any): Task {
    return new Task({
      id: row.id,
      stepId: row.step_id,
      orderId: row.order_id,
      workerId: row.worker_id,
      machineId: row.machine_id,
      status: row.status,
      priority: row.priority,
      quantity: row.quantity,
      completedQty: row.completed_qty,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : null,
      startedAt: row.started_at ? new Date(row.started_at) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
