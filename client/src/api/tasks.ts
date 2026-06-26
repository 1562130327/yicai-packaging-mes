import { api } from './request'

// 使用共享类型
export type { Task, TaskStatus, Priority, TaskStats, AssignTaskAction, CompleteTaskAction, StartWorkflowAction } from '../../../packages/shared/task.js'
export { TASK_STATUS_RULES, PRIORITY_RULES, canTransition, canPerformAction, getStatusLabel, getStatusStyle, getPriorityLabel, getPriorityStyle } from '../../../packages/shared/task.js'

import type { Task, TaskStats, StartWorkflowAction } from '../../../packages/shared/task.js'

export const tasksApi = {
  list: (params?: { status?: string; workerId?: string; orderId?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return api.get<{ success: boolean; data: Task[] }>(`/tasks${query ? '?' + query : ''}`)
  },
  get: (id: string) => api.get<{ success: boolean; data: Task }>(`/tasks/${id}`),
  stats: () => api.get<{ success: boolean; data: TaskStats }>('/tasks/stats'),
  assign: (id: string, workerId: string, machineId: string) =>
    api.put<{ success: boolean }>(`/tasks/${id}/assign`, { workerId, machineId }),
  start: (id: string) =>
    api.put<{ success: boolean }>(`/tasks/${id}/start`),
  complete: (id: string, quantity: number, defectQty?: number) =>
    api.put<{ success: boolean }>(`/tasks/${id}/complete`, { quantity, defectQty }),
  pause: (id: string, reason?: string) =>
    api.put<{ success: boolean }>(`/tasks/${id}/pause`, { reason }),
  resume: (id: string) =>
    api.put<{ success: boolean }>(`/tasks/${id}/resume`),
  cancel: (id: string, reason?: string) =>
    api.put<{ success: boolean }>(`/tasks/${id}/cancel`, { reason }),
}

export const taskFlowApi = {
  start: (data: StartWorkflowAction) =>
    api.post<{ success: boolean; message: string }>('/task-flow/start', data),
}
