import { api } from './request'

export interface Execution {
  id: string
  taskId: string
  workerId: string
  quantity: number
  defectQty: number
  goodQty: number
  yieldRate: number
  recordedAt: string
}

export const executionsApi = {
  list: (params?: { taskId?: string }) => {
    const query = params?.taskId ? `?taskId=${params.taskId}` : ''
    return api.get<{ success: boolean; data: Execution[] }>(`/executions${query}`)
  },
  create: (data: { taskId: string; workerId: string; machineId?: string; quantity: number; defectQty?: number; notes?: string }) =>
    api.post<{ success: boolean; data: { id: string; goodQty: number; yieldRate: number } }>('/executions', data),
}
