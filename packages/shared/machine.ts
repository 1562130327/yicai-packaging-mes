/**
 * 共享领域模型 — Machine
 *
 * 前后端共享同一套类型定义
 * 所有业务规则在这里定义，前后端共同遵守
 */

// ========== Machine 状态 ==========
export type MachineStatus = 'running' | 'idle' | 'fault' | 'maintenance' | 'offline';

/**
 * Machine 状态规则（唯一真相）
 */
export const MACHINE_STATUS_RULES = {
  transitions: {
    running: ['idle', 'fault', 'maintenance', 'offline'],
    idle: ['running', 'maintenance', 'offline'],
    fault: ['maintenance', 'offline'],
    maintenance: ['idle', 'offline'],
    offline: ['idle'],
  } as Record<MachineStatus, MachineStatus[]>,

  labels: {
    running: '运行中',
    idle: '空闲',
    fault: '故障',
    maintenance: '维护中',
    offline: '离线',
  } as Record<MachineStatus, string>,

  styles: {
    running: 'badge-success',
    idle: 'badge-info',
    fault: 'badge-danger',
    maintenance: 'badge-warning',
    offline: '',
  } as Record<MachineStatus, string>,
};

/**
 * 检查状态转换是否合法
 */
export function canTransitionMachine(from: MachineStatus, to: MachineStatus): boolean {
  return MACHINE_STATUS_RULES.transitions[from]?.includes(to) ?? false;
}

/**
 * 获取状态标签
 */
export function getMachineStatusLabel(status: MachineStatus): string {
  return MACHINE_STATUS_RULES.labels[status] || status;
}

/**
 * 获取状态样式
 */
export function getMachineStatusStyle(status: MachineStatus): string {
  return MACHINE_STATUS_RULES.styles[status] || '';
}
