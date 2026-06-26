import { api } from './request'

export interface DashboardData {
  kpi: {
    activeOrders: number
    completedToday: number
    machineUtilization: string
    personnelOnDuty: number
  }
  orders: Array<{
    id: string
    code: string
    productCode: string
    customerName: string
    priority: string
    status: string
    materialSpec: string
    quantity: number
    dueDate: string
  }>
  machines: Array<{
    id: string
    code: string
    name: string
    type: string
    status: string
  }>
  workers: Array<{
    id: string
    name: string
    role: string
    team: string
    status: string
  }>
  pipeline: Array<{
    stage: string
    count: number
  }>
  inventoryAlerts: number
}

export const dashboardApi = {
  getData: () => api.get<{ success: boolean; data: DashboardData }>('/dashboard'),
}
