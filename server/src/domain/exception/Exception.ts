import { AggregateRoot } from '../shared/AggregateRoot.js';
import { DomainEvent } from '../shared/DomainEvent.js';

/**
 * Exception 类型枚举
 */
export type ExceptionType = 'material_quality' | 'machine_failure' | 'staff_shortage' | 'process_issue' | 'other';

/**
 * Exception 严重程度枚举
 */
export type ExceptionSeverity = 'low' | 'medium' | 'high';

/**
 * Exception 状态枚举
 */
export type ExceptionStatus = 'open' | 'resolved';

/**
 * Exception 领域事件
 */
export class ExceptionRaised extends DomainEvent {
  constructor(exceptionId: string, taskId: string, type: ExceptionType, severity: ExceptionSeverity) {
    super({
      eventType: 'exception.raised',
      aggregateType: 'exception',
      aggregateId: exceptionId,
      payload: { taskId, type, severity },
    });
  }
}

export class ExceptionResolved extends DomainEvent {
  constructor(exceptionId: string, resolution: string) {
    super({
      eventType: 'exception.resolved',
      aggregateType: 'exception',
      aggregateId: exceptionId,
      payload: { resolution },
    });
  }
}

/**
 * Exception 聚合根
 * 生产异常：记录和处理生产过程中的问题
 */
export class Exception extends AggregateRoot {
  private _taskId: string;
  private _type: ExceptionType;
  private _severity: ExceptionSeverity;
  private _description: string;
  private _status: ExceptionStatus;
  private _resolution: string | null;
  private _detectedAt: Date;
  private _resolvedAt: Date | null;

  constructor(params: {
    id: string;
    taskId: string;
    type: ExceptionType;
    severity: ExceptionSeverity;
    description: string;
    status: ExceptionStatus;
    resolution: string | null;
    detectedAt: Date;
    resolvedAt: Date | null;
  }) {
    super(params.id);
    this._taskId = params.taskId;
    this._type = params.type;
    this._severity = params.severity;
    this._description = params.description;
    this._status = params.status;
    this._resolution = params.resolution;
    this._detectedAt = params.detectedAt;
    this._resolvedAt = params.resolvedAt;
  }

  // ========== Getters ==========
  get taskId(): string { return this._taskId; }
  get type(): ExceptionType { return this._type; }
  get severity(): ExceptionSeverity { return this._severity; }
  get description(): string { return this._description; }
  get status(): ExceptionStatus { return this._status; }
  get resolution(): string | null { return this._resolution; }
  get detectedAt(): Date { return this._detectedAt; }
  get resolvedAt(): Date | null { return this._resolvedAt; }

  // ========== 业务操作 ==========

  resolve(resolution: string): void {
    if (this._status === 'resolved') {
      throw new Error('Exception already resolved');
    }
    this._status = 'resolved';
    this._resolution = resolution;
    this._resolvedAt = new Date();
    this.addEvent(new ExceptionResolved(this.id, resolution));
  }

  // ========== 工厂方法 ==========

  static create(params: {
    id: string;
    taskId: string;
    type: ExceptionType;
    severity: ExceptionSeverity;
    description: string;
  }): Exception {
    const exception = new Exception({
      id: params.id,
      taskId: params.taskId,
      type: params.type,
      severity: params.severity,
      description: params.description,
      status: 'open',
      resolution: null,
      detectedAt: new Date(),
      resolvedAt: null,
    });
    exception.addEvent(new ExceptionRaised(params.id, params.taskId, params.type, params.severity));
    return exception;
  }

  static fromRow(row: any): Exception {
    return new Exception({
      id: row.id,
      taskId: row.order_id, // 兼容旧表结构
      type: row.type,
      severity: row.severity,
      description: row.description,
      status: row.resolved_at ? 'resolved' : 'open',
      resolution: row.resolution,
      detectedAt: new Date(row.detected_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    });
  }
}
