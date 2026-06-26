/**
 * 领域事件基类
 * 所有领域事件都继承此基类
 */
export abstract class DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: Record<string, any>;

  constructor(params: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, any>;
  }) {
    this.eventId = crypto.randomUUID();
    this.eventType = params.eventType;
    this.aggregateType = params.aggregateType;
    this.aggregateId = params.aggregateId;
    this.timestamp = new Date();
    this.payload = params.payload;
  }

  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateType: this.aggregateType,
      aggregateId: this.aggregateId,
      timestamp: this.timestamp.toISOString(),
      payload: this.payload,
    };
  }
}
