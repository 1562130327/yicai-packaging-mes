import { api } from './request'

export interface Worker {
  id: string
  name: string
  role: string
  team: string
  status: string
  skills: string[]
}

export interface WorkerTask {
  id: string
  orderId: string
  stepId: string
  status: string
  worker: string
  orderCode: string
  productCode: string
  customerName: string
  priority: string
  stepType: string
  stepStatus: string
}

export const workersApi = {
  list: () => api.get<{ success: boolean; data: Worker[] }>('/workers'),
  getTasks: (id: string) =>
    api.get<{ success: boolean; data: { worker: any[]; tasks: WorkerTask[] } }>(
      `/workers/${id}/tasks`
    ),
}
