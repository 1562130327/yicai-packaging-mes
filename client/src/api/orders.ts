import { api } from './request'

export interface Order {
  id: string
  code: string
  productCode: string
  customerName: string
  category: string
  processType: string
  priority: string
  status: string
  materialSpec: string
  sheetSize: string
  quantity: number
  dueDate: string
  createdAt: string
}

export interface OrderCreateInput {
  productCode: string
  customerName: string
  category: string
  processType: string
  priority?: string
  materialSpec: string
  sheetSize: string
  quantity: number
  dueDate: string
}

export const ordersApi = {
  list: () => api.get<{ success: boolean; data: Order[] }>('/orders'),
  get: (id: string) => api.get<{ success: boolean; data: Order }>(`/orders/${id}`),
  create: (data: OrderCreateInput) =>
    api.post<{ success: boolean; data: { id: string; code: string } }>('/orders', data),
  update: (id: string, data: Partial<Order>) =>
    api.put<{ success: boolean }>(`/orders/${id}`, data),
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/orders/${id}`),
}
