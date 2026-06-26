/**
 * 共享领域模型 — Order
 *
 * 前后端共享同一套类型定义
 * 所有业务规则在这里定义，前后端共同遵守
 */

// ========== Order 状态机 ==========
export type OrderStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Order 状态流转规则（唯一真相）
 */
export const ORDER_STATUS_RULES = {
  transitions: {
    pending: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],  // 终态
    cancelled: [],  // 终态
  } as Record<OrderStatus, OrderStatus[]>,

  allowedActions: {
    pending: ['schedule', 'cancel'],
    scheduled: ['start', 'cancel'],
    in_progress: ['complete', 'cancel'],
    completed: [],
    cancelled: [],
  } as Record<OrderStatus, string[]>,

  labels: {
    pending: '待排产',
    scheduled: '已排产',
    in_progress: '生产中',
    completed: '已完成',
    cancelled: '已取消',
  } as Record<OrderStatus, string>,

  styles: {
    pending: 'badge-warning',
    scheduled: 'badge-info',
    in_progress: 'badge-success',
    completed: '',
    cancelled: '',
  } as Record<OrderStatus, string>,
};

/**
 * 检查状态转换是否合法
 */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_RULES.transitions[from]?.includes(to) ?? false;
}

/**
 * 检查某个操作是否可以在当前状态执行
 */
export function canPerformOrderAction(status: OrderStatus, action: string): boolean {
  return ORDER_STATUS_RULES.allowedActions[status]?.includes(action) ?? false;
}

/**
 * 获取状态标签
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_RULES.labels[status] || status;
}

/**
 * 获取状态样式
 */
export function getOrderStatusStyle(status: OrderStatus): string {
  return ORDER_STATUS_RULES.styles[status] || '';
}

// ========== Order 优先级 ==========
export type OrderPriority = 'unmentioned' | 'attention' | 'normal' | 'urgent' | 'deadline';

export const ORDER_PRIORITY_RULES = {
  labels: {
    unmentioned: 'P4 最低',
    attention: 'P3 低',
    normal: 'P2 中',
    urgent: 'P1 高',
    deadline: 'P0 紧急',
  } as Record<OrderPriority, string>,

  styles: {
    unmentioned: 'priority-p4',
    attention: 'priority-p3',
    normal: 'priority-p2',
    urgent: 'priority-p1',
    deadline: 'priority-p0',
  } as Record<OrderPriority, string>,
};

export function getOrderPriorityLabel(priority: OrderPriority): string {
  return ORDER_PRIORITY_RULES.labels[priority] || priority;
}

export function getOrderPriorityStyle(priority: OrderPriority): string {
  return ORDER_PRIORITY_RULES.styles[priority] || '';
}

// ========== Order 工序类型 ==========
export type OrderStepType = 'cutting' | 'slicing' | 'welding' | 'pressing' | 'inspection' | 'packaging';

export const ORDER_STEP_TYPE_LABELS: Record<OrderStepType, string> = {
  cutting: '下料',
  slicing: '裁切',
  welding: '焊接',
  pressing: '压合',
  inspection: '检验',
  packaging: '入库',
};

export function getOrderStepTypeLabel(type: string): string {
  return ORDER_STEP_TYPE_LABELS[type as OrderStepType] || type;
}

// ========== Order 工序状态 ==========
export type OrderStepStatus = 'waiting' | 'ready' | 'running' | 'done' | 'paused';

export const ORDER_STEP_STATUS_LABELS: Record<OrderStepStatus, string> = {
  waiting: '等待',
  ready: '就绪',
  running: '进行中',
  done: '已完成',
  paused: '已暂停',
};

export function getOrderStepStatusLabel(status: string): string {
  return ORDER_STEP_STATUS_LABELS[status as OrderStepStatus] || status;
}
