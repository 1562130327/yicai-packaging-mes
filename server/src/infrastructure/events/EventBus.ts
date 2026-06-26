import { DomainEvent } from '../../domain/shared/DomainEvent.js';

/**
 * 事件处理器类型
 */
type EventHandler = (event: DomainEvent) => Promise<void>;

const MAX_RETRIES = 3;

/**
 * 内存事件总线
 * 实现发布-订阅模式，解耦模块间通信
 *
 * 修复：添加重试计数器，失败事件记录日志并重试
 */
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private failedEvents: Array<{ event: DomainEvent; attempts: number; error: Error }> = [];

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
   * 发布事件（异步执行所有处理器，失败时重试）
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    const allHandlers = [...handlers, ...this.handlers.get('*') || []];

    for (const handler of allHandlers) {
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await handler(event);
          lastError = null;
          break;
        } catch (error) {
          lastError = error as Error;
          console.error(
            `[EventBus] Attempt ${attempt}/${MAX_RETRIES} failed for event ${event.eventType} (id=${event.eventId}):`,
            error
          );
        }
      }
      if (lastError) {
        this.failedEvents.push({ event, attempts: MAX_RETRIES, error: lastError });
        console.error(
          `[EventBus] Event ${event.eventType} (id=${event.eventId}) failed after ${MAX_RETRIES} attempts, recorded to failedEvents queue`
        );
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

  /**
   * 获取失败事件列表（用于监控/手动重试）
   */
  getFailedEvents(): Array<{ event: DomainEvent; attempts: number; error: Error }> {
    return [...this.failedEvents];
  }
}

// 全局单例
export const eventBus = new EventBus();
