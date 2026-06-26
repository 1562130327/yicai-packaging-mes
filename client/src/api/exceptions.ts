import { api } from './request'

export interface Exception {
  id: string
  taskId: string
  type: string
  severity: string
  description: string
  status: string
  detectedAt: string
}

export const exceptionsApi = {
  list: () => api.get<{ success: boolean; data: Exception[] }>('/exceptions'),
  open: () => api.get<{ success: boolean; data: Exception[] }>('/exceptions/open'),
  create: (data: { taskId: string; type: string; severity?: string; description: string }) =>
    api.post<{ success: boolean; data: { id: string; status: string } }>('/exceptions', data),
  resolve: (id: string, resolution: string) =>
    api.put<{ success: boolean }>(`/exceptions/${id}/resolve`, { resolution }),
}
