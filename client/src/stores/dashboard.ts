import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi, type DashboardData } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchData() {
    loading.value = true
    error.value = null
    try {
      const result = await dashboardApi.getData()
      if (result.success) {
        data.value = result.data
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
})
