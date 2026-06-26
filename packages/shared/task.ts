/**
 * 共享领域模型 — Task
 *
 * 前后端共享同一套类型定义
 * 所有业务规则在这里定义，前后端共同遵守
 */

// ========== Task 状态机 ==========
export type TaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'paused' | 'cancelled';

/**
 * Task 状态流转规则（唯一真相）
 * 前端和后端都必须遵守这个规则
 */
export const TASK_STATUS_RULES = {
  // 每个状态可以转换到哪些状态
  transitions: {
    pending: ['assigned', 'cancelled'],
    assigned: ['running', 'cancelled'],
    running: ['completed', 'paused', 'cancelled'],
    paused: ['running', 'cancelled'],
    completed: [],  // 终态
    cancelled: [],  // 终态
  } as Record<TaskStatus, TaskStatus[]>,

  // 每个状态可以执行哪些操作
  allowedActions: {
    pending: ['assign', 'cancel'],
    assigned: ['start', 'cancel'],
    running: ['complete', 'pause', 'cancel'],
    paused: ['resume', 'cancel'],
    completed: [],
    cancelled: [],
  } as Record<TaskStatus, string[]>,

  // 每个状态的显示标签
  labels: {
    pending: '待分配',
    assigned: '已分配',
    running: '进行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消',
  } as Record<TaskStatus, string>,

  // 每个状态的显示样式
  styles: {
    pending: 'badge-warning',
    assigned: 'badge-info',
    running: 'badge-success',
    completed: '',
    paused: 'badge-danger',
    cancelled: '',
  } as Record<TaskStatus, string>,
};

/**
 * 检查状态转换是否合法
 */
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_STATUS_RULES.transitions[from]?.includes(to) ?? false;
}

/**
 * 检查某个操作是否可以在当前状态执行
 */
export function canPerformAction(status: TaskStatus, action: string): boolean {
  return TASK_STATUS_RULES.allowedActions[status]?.includes(action) ?? false;
}

/**
 * 获取状态标签
 */
export function getStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_RULES.labels[status] || status;
}

/**
 * 获取状态样式
 */
export function getStatusStyle(status: TaskStatus): string {
  return TASK_STATUS_RULES.styles[status] || '';
}

// ========== Priority ==========
export type Priority = 1 | 2 | 3 | 4 | 5;

export const PRIORITY_RULES = {
  labels: {
    1: 'P4 最低',
    2: 'P3 低',
    3: 'P2 中',
    4: 'P1 高',
    5: 'P0 紧急',
  } as Record<Priority, string>,

  styles: {
    1: 'priority-p4',
    2: 'priority-p3',
    3: 'priority-p2',
    4: 'priority-p1',
    5: 'priority-p0',
  } as Record<Priority, string>,
};

export function getPriorityLabel(priority: Priority): string {
  return PRIORITY_RULES.labels[priority] || `P${priority}`;
}

export function getPriorityStyle(priority: Priority): string {
  return PRIORITY_RULES.styles[priority] || '';
}

// ========== Task 数据结构 ==========
export interface Task {
  id: string;
  stepId: string;
  orderId: string;
  workerId: string | null;
  machineId: string | null;
  status: TaskStatus;
  priority: Priority;
  quantity: number;
  completedQty: number;
  startedAt: string | null;
  completedAt: string | null;
}

// ========== Task 统计 ==========
export interface TaskStats {
  pending: number;
  assigned: number;
  running: number;
  completed: number;
}

// ========== Task 动作（Action-based API） ==========
export interface AssignTaskAction {
  workerId: string;
  machineId: string;
}

export interface CompleteTaskAction {
  quantity: number;
  defectQty?: number;
}

export interface PauseTaskAction {
  reason: string;
}

// ========== Task Flow ==========
export interface StartWorkflowAction {
  orderId: string;
  templateName: string;
  quantity: number;
}
