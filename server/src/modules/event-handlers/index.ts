import { EventBus } from '../../infrastructure/events/EventBus.js';
import { EventStore } from '../../infrastructure/events/EventStore.js';
import { queryOne } from '../../infrastructure/database.js';

/**
 * 注册所有事件处理器
 * 这是事件驱动架构的核心
 */
export function registerEventHandlers(eventBus: EventBus, eventStore: EventStore): void {

  // ========== Task 事件 ==========

  // TaskStarted → 更新机器状态为 running
  eventBus.on('task.started', async (event) => {
    const { workerId } = event.payload;
    console.log(`[Event] TaskStarted: worker ${workerId} started task ${event.aggregateId}`);
    // 后续可以：通知管理员、更新看板等
  });

  // TaskPaused → 记录暂停原因
  eventBus.on('task.paused', async (event) => {
    console.log(`[Event] TaskPaused: ${event.aggregateId} - ${event.payload.reason}`);
  });

  // TaskCancelled → 记录取消原因
  eventBus.on('task.cancelled', async (event) => {
    console.log(`[Event] TaskCancelled: ${event.aggregateId} - ${event.payload.reason}`);
  });

  // ========== Execution 事件 ==========

  // ExecutionRecorded → 更新产量统计
  eventBus.on('execution.recorded', async (event) => {
    const { taskId, quantity, defectQty } = event.payload;
    console.log(`[Event] ExecutionRecorded: task ${taskId} produced ${quantity} units (${defectQty} defects)`);
    // 后续可以：更新产量看板、触发质量检查等
  });

  // ========== Material 事件 ==========

  // MaterialConsumed → 更新库存
  eventBus.on('material.consumed', async (event) => {
    const { batchId, quantity, remainingQty } = event.payload;
    console.log(`[Event] MaterialConsumed: batch ${batchId} -${quantity} (remaining: ${remainingQty})`);
  });

  // MaterialInbound → 记录入库
  eventBus.on('material.inbound', async (event) => {
    const { batchNo, quantity } = event.payload;
    console.log(`[Event] MaterialInbound: ${batchNo} +${quantity}`);
  });

  // MaterialStockLow → 库存预警
  eventBus.on('material.stock_low', async (event) => {
    const { batchNo, remainingQty, unit } = event.payload;
    console.log(`[Event] MaterialStockLow: ${batchNo} has only ${remainingQty} ${unit} remaining!`);
    // 后续可以：发送采购预警通知
  });

  // ========== Exception 事件 ==========

  // ExceptionRaised → 异常上报
  eventBus.on('exception.raised', async (event) => {
    const { taskId, type, severity } = event.payload;
    console.log(`[Event] ExceptionRaised: ${type} (${severity}) on task ${taskId}`);
    // 后续可以：通知管理员、触发应急预案
  });

  // ExceptionResolved → 异常解决
  eventBus.on('exception.resolved', async (event) => {
    const { resolution } = event.payload;
    console.log(`[Event] ExceptionResolved: ${event.aggregateId} - ${resolution}`);
  });

  console.log('[EventHandlers] All event handlers registered');
}
