import { AggregateRoot } from '../shared/AggregateRoot.js';
import { DomainEvent } from '../shared/DomainEvent.js';

/**
 * Execution 领域事件
 */
export class ExecutionRecorded extends DomainEvent {
  constructor(executionId: string, taskId: string, workerId: string, quantity: number, defectQty: number) {
    super({
      eventType: 'execution.recorded',
      aggregateType: 'execution',
      aggregateId: executionId,
      payload: { taskId, workerId, quantity, defectQty },
    });
  }
}

/**
 * Execution 聚合根
 * 生产执行记录：记录 Task 的实际生产数据
 */
export class Execution extends AggregateRoot {
  private _taskId: string;
  private _workerId: string;
  private _machineId: string | null;
  private _quantity: number;
  private _defectQty: number;
  private _notes: string;
  private _recordedAt: Date;

  constructor(params: {
    id: string;
    taskId: string;
    workerId: string;
    machineId?: string | null;
    quantity: number;
    defectQty: number;
    notes: string;
    recordedAt: Date;
  }) {
    super(params.id);
    this._taskId = params.taskId;
    this._workerId = params.workerId;
    this._machineId = params.machineId ?? null;
    this._quantity = params.quantity;
    this._defectQty = params.defectQty;
    this._notes = params.notes;
    this._recordedAt = params.recordedAt;
  }

  // ========== Getters ==========
  get taskId(): string { return this._taskId; }
  get workerId(): string { return this._workerId; }
  get machineId(): string | null { return this._machineId; }
  get quantity(): number { return this._quantity; }
  get defectQty(): number { return this._defectQty; }
  get notes(): string { return this._notes; }
  get recordedAt(): Date { return this._recordedAt; }

  /**
   * 计算良品数
   */
  get goodQty(): number {
    return this._quantity - this._defectQty;
  }

  /**
   * 计算良品率
   */
  get yieldRate(): number {
    if (this._quantity === 0) return 0;
    return Math.round((this.goodQty / this._quantity) * 100);
  }

  // ========== 工厂方法 ==========

  static create(params: {
    id: string;
    taskId: string;
    workerId: string;
    machineId?: string;
    quantity: number;
    defectQty?: number;
    notes?: string;
  }): Execution {
    const execution = new Execution({
      id: params.id,
      taskId: params.taskId,
      workerId: params.workerId,
      machineId: params.machineId,
      quantity: params.quantity,
      defectQty: params.defectQty ?? 0,
      notes: params.notes ?? '',
      recordedAt: new Date(),
    });
    execution.addEvent(new ExecutionRecorded(
      params.id, params.taskId, params.workerId, params.quantity, params.defectQty ?? 0
    ));
    return execution;
  }

  static fromRow(row: any): Execution {
    return new Execution({
      id: row.id,
      taskId: row.task_id,
      workerId: row.worker_id,
      machineId: row.machine_id,
      quantity: row.quantity,
      defectQty: row.defect_qty,
      notes: row.notes || '',
      recordedAt: new Date(row.timestamp),
    });
  }
}
