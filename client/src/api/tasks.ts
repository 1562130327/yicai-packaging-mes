import { api } from './request'

export interface Task {
  id: string
  stepId: string
  orderId: string
  workerId: string | null
  machineId: string | null
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'paused' | 'cancelled'
  priority: number
  quantity: number
  completedQty: number
  startedAt: string | null
  completedAt: string | null
}

export interface TaskStats {
  pending: number
  assigned: number
  running: number
  completed: number
}

export const tasksApi = {
  list: (params?: { status?: string; workerId?: string; orderId?: string }) => {
    const query = new URLSearchParams(params as any).toString()
    return api.get<{ success: boolean; data: Task[] }>(`/tasks${query ? '?' + query : ''}`)
  },
  get: (id: string) => api.get<{ success: boolean; data: Task }>(`/tasks/${id}`),
  stats: () => api.get<{ success: boolean; data: TaskStats }>('/tasks/stats'),
  create: (data: { stepId: string; orderId: string; quantity: number; priority?: number }) =>
    api.post<{ success: boolean; data: { id: string; status: string } }>('/tasks', data),
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

// Task Flow API
export const taskFlowApi = {
  start: (data: { orderId: string; templateName: string; quantity: number }) =>
    api.post<{ success: boolean; message: string }>('/task-flow/start', data),
}
