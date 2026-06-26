import { api } from './request'

export interface Machine {
  id: string
  code: string
  name: string
  type: string
  status: string
  processTypes: string[]
  workshop: string
}

export const machinesApi = {
  list: () => api.get<{ success: boolean; data: Machine[] }>('/machines'),
  updateStatus: (id: string, status: string) =>
    api.put<{ success: boolean }>(`/machines/${id}/status`, { status }),
}
