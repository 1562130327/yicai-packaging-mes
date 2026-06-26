import { DomainEvent } from '../../domain/shared/DomainEvent.js';
import { execute, getDb, queryAll } from '../database.js';

/**
 * 事件存储
 * 将领域事件持久化到 domain_events 表
 */
export class EventStore {
  /**
   * 保存事件
   */
  save(event: DomainEvent): void {
    execute(
      `INSERT INTO domain_events (id, aggregate_type, aggregate_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event.eventId,
        event.aggregateType,
        event.aggregateId,
        event.eventType,
        JSON.stringify(event.payload),
        event.timestamp.toISOString(),
      ]
    );
  }

  /**
   * 批量保存事件（事务包装，保证原子性）
   */
  saveAll(events: DomainEvent[]): void {
    if (events.length === 0) return;

    const insertEvent = getDb().prepare(
      `INSERT INTO domain_events (id, aggregate_type, aggregate_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const insertAll = getDb().transaction((evts: DomainEvent[]) => {
      for (const event of evts) {
        insertEvent.run(
          event.eventId,
          event.aggregateType,
          event.aggregateId,
          event.eventType,
          JSON.stringify(event.payload),
          event.timestamp.toISOString()
        );
      }
    });

    insertAll(events);
  }

  /**
   * 查询事件（按聚合根）
   */
  findByAggregate(aggregateType: string, aggregateId: string): any[] {
    return queryAll(
      `SELECT * FROM domain_events WHERE aggregate_type = ? AND aggregate_id = ? ORDER BY created_at ASC`,
      [aggregateType, aggregateId]
    );
  }

  /**
   * 查询事件（按类型）
   */
  findByType(eventType: string, limit: number = 50): any[] {
    return queryAll(
      `SELECT * FROM domain_events WHERE event_type = ? ORDER BY created_at DESC LIMIT ?`,
      [eventType, limit]
    );
  }

  /**
   * 查询最近事件
   */
  findRecent(limit: number = 50): any[] {
    return queryAll(
      `SELECT * FROM domain_events ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
  }
}

// 全局单例
export const eventStore = new EventStore();
