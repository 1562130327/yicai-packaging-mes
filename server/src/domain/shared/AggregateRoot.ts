import { Entity } from './Entity.js';
import { DomainEvent } from './DomainEvent.js';

/**
 * 聚合根基类
 * 所有聚合根都继承此基类，支持领域事件收集
 */
export abstract class AggregateRoot extends Entity<string> {
  private _domainEvents: DomainEvent[] = [];

  /**
   * 添加领域事件（由领域操作触发）
   */
  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 获取并清空所有待发布事件
   */
  pullEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * 获取当前待发布事件（不清空）
   */
  peekEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 清空事件
   */
  clearEvents(): void {
    this._domainEvents = [];
  }
}
