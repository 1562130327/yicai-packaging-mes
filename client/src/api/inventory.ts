import { api } from './request'

export interface InventoryItem {
  id: string
  batchNo: string
  materialSpec: string
  remainingQty: number
  unit: string
  supplierName: string
  color: string
  batchWidth: number
  price: number
  materialInfo: string
  sheetSize: string
}

export const inventoryApi = {
  list: () => api.get<{ success: boolean; data: InventoryItem[] }>('/inventory'),
  getAlerts: () =>
    api.get<{ success: boolean; data: InventoryItem[] }>('/inventory/alerts'),
}
