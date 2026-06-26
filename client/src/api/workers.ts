import { api } from './request'

// 使用共享类型
export type { WorkerStatus } from '../../../packages/shared/worker.js'
export { WORKER_STATUS_RULES, getWorkerStatusLabel, getWorkerStatusStyle, canTransitionWorker } from '../../../packages/shared/worker.js'

import type { WorkerStatus } from '../../../packages/shared/worker.js'

export interface Worker {
  id: string
  name: string
  role: string
  team: string
  status: WorkerStatus
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
