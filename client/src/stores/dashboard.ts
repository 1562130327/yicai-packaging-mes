import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/request'

export interface DashboardData {
  kpi: {
    activeOrders: number
    pendingTasks: number
    runningTasks: number
    completedToday: number
    inventoryAlerts: number
    anomalyCount: number
  }
  recentTasks: any[]
  machines: any[]
  workers: any[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchData() {
    loading.value = true
    error.value = null
    try {
      const res = await api.get<{ success: boolean; data: DashboardData }>('/dashboard')
      if (res.success) data.value = res.data
    } catch (e: any) {
      error.value = e.message
    } finally { loading.value = false }
  }

  return { data, loading, error, fetchData }
})
