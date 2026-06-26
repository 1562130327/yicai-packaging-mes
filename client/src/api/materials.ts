import { api } from './request'

export interface MaterialBatch {
  id: string
  batchNo: string
  materialSpec: string
  remainingQty: number
  unit: string
  supplierName: string
  color: string
}

export const materialsApi = {
  list: () => api.get<{ success: boolean; data: MaterialBatch[] }>('/materials'),
  alerts: (threshold?: number) =>
    api.get<{ success: boolean; data: MaterialBatch[] }>(`/materials/alerts${threshold ? '?threshold=' + threshold : ''}`),
  inbound: (data: { batchNo: string; materialSpec: string; supplierName?: string; color?: string; quantity: number; unit?: string; price?: number }) =>
    api.post<{ success: boolean; data: { id: string; batchNo: string; remainingQty: number } }>('/materials/inbound', data),
  consume: (data: { taskId: string; batchId: string; quantity: number }) =>
    api.post<{ success: boolean }>('/materials/consume', data),
}
