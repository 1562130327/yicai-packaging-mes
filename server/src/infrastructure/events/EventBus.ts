import { DomainEvent } from '../../domain/shared/DomainEvent.js';

/**
 * 事件处理器类型
 */
type EventHandler = (event: DomainEvent) => Promise<void>;

/**
 * 内存事件总线
 * 实现发布-订阅模式，解耦模块间通信
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * 注册事件处理器
   */
  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  /**
   * 移除事件处理器
   */
  off(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    const index = existing.indexOf(handler);
    if (index > -1) {
      existing.splice(index, 1);
    }
  }

  /**
   * 发布事件（异步执行所有处理器）
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    const allHandlers = [...handlers, ...this.handlers.get('*') || []];

    for (const handler of allHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Error handling event ${event.eventType}:`, error);
      }
    }
  }

  /**
   * 发布多个事件
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * 获取已注册的事件类型
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// 全局单例
export const eventBus = new EventBus();
