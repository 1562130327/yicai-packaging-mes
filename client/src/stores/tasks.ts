import { defineStore } from 'pinia'
import { ref } from 'vue'
import { tasksApi, type Task, type TaskStats } from '@/api/tasks'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const stats = ref<TaskStats>({ pending: 0, assigned: 0, running: 0, completed: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTasks(params?: { status?: string; workerId?: string }) {
    loading.value = true
    error.value = null
    try {
      const res = await tasksApi.list(params)
      if (res.success) tasks.value = res.data
    } catch (e: any) {
      error.value = e.message
    } finally { loading.value = false }
  }

  async function fetchStats() {
    try {
      const res = await tasksApi.stats()
      if (res.success) stats.value = res.data
    } catch (e: any) {
      error.value = e.message
    }
  }

  async function startTask(taskId: string) {
    await tasksApi.start(taskId)
    await fetchTasks()
    await fetchStats()
  }

  async function completeTask(taskId: string, quantity: number, defectQty: number = 0) {
    await tasksApi.complete(taskId, quantity, defectQty)
    await fetchTasks()
    await fetchStats()
  }

  async function pauseTask(taskId: string, reason?: string) {
    await tasksApi.pause(taskId, reason)
    await fetchTasks()
    await fetchStats()
  }

  return { tasks, stats, loading, error, fetchTasks, fetchStats, startTask, completeTask, pauseTask }
})
