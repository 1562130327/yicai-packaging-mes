/**
 * 共享领域模型 — Worker
 *
 * 前后端共享同一套类型定义
 * 所有业务规则在这里定义，前后端共同遵守
 */

// ========== Worker 状态 ==========
export type WorkerStatus = 'active' | 'inactive' | 'offline';

/**
 * Worker 状态规则（唯一真相）
 */
export const WORKER_STATUS_RULES = {
  transitions: {
    active: ['inactive', 'offline'],
    inactive: ['active', 'offline'],
    offline: ['active'],
  } as Record<WorkerStatus, WorkerStatus[]>,

  labels: {
    active: '在岗',
    inactive: '休息',
    offline: '离线',
  } as Record<WorkerStatus, string>,

  styles: {
    active: 'badge-success',
    inactive: 'badge-warning',
    offline: '',
  } as Record<WorkerStatus, string>,
};

/**
 * 检查状态转换是否合法
 */
export function canTransitionWorker(from: WorkerStatus, to: WorkerStatus): boolean {
  return WORKER_STATUS_RULES.transitions[from]?.includes(to) ?? false;
}

/**
 * 获取状态标签
 */
export function getWorkerStatusLabel(status: WorkerStatus): string {
  return WORKER_STATUS_RULES.labels[status] || status;
}

/**
 * 获取状态样式
 */
export function getWorkerStatusStyle(status: WorkerStatus): string {
  return WORKER_STATUS_RULES.styles[status] || '';
}
