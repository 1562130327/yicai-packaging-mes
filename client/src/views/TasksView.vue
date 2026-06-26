<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'
import { workersApi, type Worker } from '@/api/workers'
// 使用共享类型 — 前端不再定义业务规则
import { getStatusLabel, getStatusStyle, getPriorityLabel, getPriorityStyle, canPerformAction } from '@/api/tasks'
import type { Task, TaskStatus } from '@/api/tasks'

const auth = useAuthStore()
const taskStore = useTasksStore()
const toast = useToast()
const workers = ref<Worker[]>([])
const selectedWorker = ref('')
const loading = ref(true)

const isWorkerView = computed(() => auth.user?.role === 'worker')

// UI 只负责调用 action，不做业务判断
async function handleStart(taskId: string) {
  try {
    await taskStore.startTask(taskId)
    toast.success('任务已开始')
  } catch (e: any) {
    toast.error(e.message || '操作失败')
  }
}

async function handleComplete(task: Task) {
  const qty = prompt(`完成数量（共 ${task.quantity}）：`, String(task.quantity))
  if (qty === null) return
  try {
    await taskStore.completeTask(task.id, parseInt(qty) || 0, 0)
    toast.success('任务已完成')
  } catch (e: any) {
    toast.error(e.message || '操作失败')
  }
}

async function handlePause(taskId: string) {
  const reason = prompt('暂停原因：')
  if (reason === null) return
  try {
    await taskStore.pauseTask(taskId, reason || '手动暂停')
    toast.warning('任务已暂停')
  } catch (e: any) {
    toast.error(e.message || '操作失败')
  }
}

onMounted(async () => {
  try {
    if (!isWorkerView.value) {
      const res = await workersApi.list()
      if (res.success) workers.value = res.data
    }
    await taskStore.fetchStats()
    await loadTasks()
  } finally { loading.value = false }
})

async function loadTasks() {
  if (isWorkerView.value) {
    await taskStore.fetchTasks({ workerId: auth.user?.id })
  } else if (selectedWorker.value) {
    await taskStore.fetchTasks({ workerId: selectedWorker.value })
  } else {
    await taskStore.fetchTasks()
  }
}
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">{{ isWorkerView ? '📋 我的任务' : '📋 任务管理' }}</div>
      <div class="stats-bar" v-if="taskStore.stats">
        <span class="stat-item">待分配: {{ taskStore.stats.pending }}</span>
        <span class="stat-item">进行中: {{ taskStore.stats.running }}</span>
        <span class="stat-item">已完成: {{ taskStore.stats.completed }}</span>
      </div>
    </div>

    <div v-if="!isWorkerView" class="filter-bar card">
      <select v-model="selectedWorker" class="form-input form-select" style="max-width:250px" @change="loadTasks">
        <option value="">全部师傅</option>
        <option v-for="w in workers" :key="w.id" :value="w.id">{{ w.name }} - {{ w.role }}</option>
      </select>
    </div>

    <div v-if="loading || taskStore.loading" class="loading">加载中...</div>
    <div v-else-if="taskStore.tasks.length === 0" class="empty">暂无任务</div>
    <div v-else class="tasks-list">
      <div v-for="task in taskStore.tasks" :key="task.id" class="task-card card">
        <div class="task-header">
          <!-- 使用共享类型显示优先级 -->
          <span class="priority" :class="getPriorityStyle(task.priority)">{{ getPriorityLabel(task.priority) }}</span>
          <!-- 使用共享类型显示状态 -->
          <span class="badge" :class="getStatusStyle(task.status)">{{ getStatusLabel(task.status) }}</span>
        </div>
        <div class="task-info">
          <div class="task-label">任务ID</div>
          <div class="task-value mono">{{ task.id.slice(0, 8) }}...</div>
        </div>
        <div class="task-info">
          <div class="task-label">数量</div>
          <div class="task-value">{{ task.quantity }} (已完成: {{ task.completedQty }})</div>
        </div>
        <div class="task-actions">
          <!-- 使用共享规则判断是否显示按钮 -->
          <button v-if="canPerformAction(task.status, 'start')" class="btn btn-sm btn-primary" @click="handleStart(task.id)">开始</button>
          <button v-if="canPerformAction(task.status, 'complete')" class="btn btn-sm" @click="handleComplete(task)">完成</button>
          <button v-if="canPerformAction(task.status, 'pause')" class="btn btn-sm" style="color:var(--warning)" @click="handlePause(task.id)">暂停</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.empty { text-align: center; padding: 40px; color: var(--muted); }
.stats-bar { display: flex; gap: 16px; font-size: 13px; color: var(--fg-secondary); }
.stat-item { font-weight: 500; }
.filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; padding: 12px 16px; }
.tasks-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.task-card { padding: 14px; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.task-info { margin-bottom: 4px; }
.task-label { font-size: 11px; color: var(--muted); }
.task-value { font-size: 13px; }
.mono { font-family: var(--font-mono); }
.task-actions { display: flex; gap: 6px; margin-top: 8px; }
</style>
