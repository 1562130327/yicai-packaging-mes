import { Entity } from '../shared/Entity.js';

/**
 * 步骤状态枚举
 */
export type StepStatus = 'waiting' | 'ready' | 'running' | 'done' | 'paused';

/**
 * WorkflowStep 实体
 * 工艺路线中的一个工序步骤
 */
export class WorkflowStep extends Entity<string> {
  private _workflowId: string;
  private _type: string;
  private _name: string;
  private _sequence: number;
  private _status: StepStatus;
  private _requiredQty: number;
  private _completedQty: number;
  private _defectQty: number;
  private _startedAt: Date | null;
  private _completedAt: Date | null;

  constructor(params: {
    id: string;
    workflowId: string;
    type: string;
    name: string;
    sequence: number;
    status: StepStatus;
    requiredQty: number;
    completedQty?: number;
    defectQty?: number;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }) {
    super(params.id);
    this._workflowId = params.workflowId;
    this._type = params.type;
    this._name = params.name;
    this._sequence = params.sequence;
    this._status = params.status;
    this._requiredQty = params.requiredQty;
    this._completedQty = params.completedQty ?? 0;
    this._defectQty = params.defectQty ?? 0;
    this._startedAt = params.startedAt ?? null;
    this._completedAt = params.completedAt ?? null;
  }

  // ========== Getters ==========
  get workflowId(): string { return this._workflowId; }
  get type(): string { return this._type; }
  get name(): string { return this._name; }
  get sequence(): number { return this._sequence; }
  get status(): StepStatus { return this._status; }
  get requiredQty(): number { return this._requiredQty; }
  get completedQty(): number { return this._completedQty; }
  get defectQty(): number { return this._defectQty; }
  get startedAt(): Date | null { return this._startedAt; }
  get completedAt(): Date | null { return this._completedAt; }

  /**
   * 检查步骤是否已完成
   */
  isCompleted(): boolean {
    return this._status === 'done';
  }

  // ========== 业务操作 ==========

  start(): void {
    if (this._status !== 'waiting' && this._status !== 'ready') {
      throw new Error(`Cannot start step '${this._name}' in status '${this._status}'`);
    }
    this._status = 'running';
    this._startedAt = new Date();
  }

  complete(outputQty: number): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot complete step '${this._name}' in status '${this._status}'`);
    }
    this._completedQty = outputQty;
    this._status = 'done';
    this._completedAt = new Date();
  }

  pause(): void {
    if (this._status !== 'running') {
      throw new Error(`Cannot pause step '${this._name}' in status '${this._status}'`);
    }
    this._status = 'paused';
  }

  resume(): void {
    if (this._status !== 'paused') {
      throw new Error(`Cannot resume step '${this._name}' in status '${this._status}'`);
    }
    this._status = 'running';
  }

  // ========== 工厂方法 ==========

  static create(params: {
    id: string;
    workflowId: string;
    type: string;
    name: string;
    sequence: number;
    requiredQty: number;
  }): WorkflowStep {
    return new WorkflowStep({
      id: params.id,
      workflowId: params.workflowId,
      type: params.type,
      name: params.name,
      sequence: params.sequence,
      status: 'waiting',
      requiredQty: params.requiredQty,
    });
  }

  static fromRow(row: any): WorkflowStep {
    return new WorkflowStep({
      id: row.id,
      workflowId: row.workflow_id,
      type: row.type,
      name: row.name,
      sequence: row.sequence,
      status: row.status,
      requiredQty: row.required_qty,
      completedQty: row.completed_qty,
      defectQty: row.defect_qty,
      startedAt: row.started_at ? new Date(row.started_at) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    });
  }
}
