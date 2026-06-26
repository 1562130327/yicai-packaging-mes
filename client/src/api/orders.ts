import { api } from './request'

// 使用共享类型
export type { OrderStatus, OrderPriority, OrderStepType, OrderStepStatus } from '../../../packages/shared/order.js'
export { ORDER_STATUS_RULES, ORDER_PRIORITY_RULES, getOrderStatusLabel, getOrderStatusStyle, getOrderPriorityLabel, getOrderPriorityStyle, getOrderStepTypeLabel, getOrderStepStatusLabel, canTransitionOrder, canPerformOrderAction } from '../../../packages/shared/order.js'

import type { OrderStatus, OrderPriority } from '../../../packages/shared/order.js'

export interface OrderStep {
  id: string
  sequence: number
  type: string
  status: string
  completedQty: number
  requiredQty: number
}

export interface Order {
  id: string
  code: string
  productCode: string
  customerName: string
  category: string
  processType: string
  priority: OrderPriority
  status: OrderStatus
  materialSpec: string
  sheetSize: string
  quantity: number
  dueDate: string
  createdAt: string
  steps?: OrderStep[]
}

export interface OrderCreateInput {
  productCode: string
  customerName: string
  category: string
  processType: string
  priority?: OrderPriority
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
