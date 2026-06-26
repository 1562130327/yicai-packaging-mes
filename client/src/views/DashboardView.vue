<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

function getPriorityClass(p: number) {
  if (p >= 5) return 'priority-p0'
  if (p >= 4) return 'priority-p1'
  if (p >= 3) return 'priority-p2'
  return 'priority-p3'
}

function getStatusLabel(s: string) {
  return { pending: '待分配', assigned: '已分配', running: '进行中', completed: '已完成' }[s] || s
}

function getMachineStatusClass(s: string) {
  return { running: 'badge-success', idle: 'badge-info', fault: 'badge-danger', maintenance: 'badge-warning' }[s] || ''
}

onMounted(() => {
  store.fetchData()
  updateTime()
  timer = setInterval(() => {
    updateTime()
    store.fetchData()
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="dashboard">
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">活跃订单</div>
        <div class="kpi-value">{{ store.data?.kpi.activeOrders || 0 }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">待分配任务</div>
        <div class="kpi-value" style="color:var(--warning)">{{ store.data?.kpi.pendingTasks || 0 }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">进行中任务</div>
        <div class="kpi-value" style="color:var(--success)">{{ store.data?.kpi.runningTasks || 0 }}</div>
      </div>
      <div class="kpi-card" v-if="(store.data?.kpi.inventoryAlerts || 0) > 0">
        <div class="kpi-label">⚠️ 库存预警</div>
        <div class="kpi-value" style="color:var(--warning)">{{ store.data?.kpi.inventoryAlerts || 0 }}</div>
      </div>
      <div class="kpi-card" v-if="(store.data?.kpi.anomalyCount || 0) > 0">
        <div class="kpi-label">🚨 异常事件</div>
        <div class="kpi-value" style="color:var(--danger)">{{ store.data?.kpi.anomalyCount || 0 }}</div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="dashboard-grid">
      <!-- 任务列表 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📋 最近任务</div>
        </div>
        <div v-if="store.data?.recentTasks?.length" class="task-list">
          <div v-for="task in store.data.recentTasks" :key="task.id" class="task-item">
            <span class="priority" :class="getPriorityClass(task.priority)">{{ task.priority }}</span>
            <span class="task-status badge" :class="getStatusLabel(task.status)">{{ getStatusLabel(task.status) }}</span>
            <span class="task-qty">{{ task.quantity }}件</span>
          </div>
        </div>
        <div v-else class="empty">暂无任务</div>
      </div>

      <!-- 机器状态 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏭 机器状态</div>
        </div>
        <div v-if="store.data?.machines?.length" class="machine-list">
          <div v-for="m in store.data.machines" :key="m.id" class="machine-item">
            <span class="status-dot" :class="m.status"></span>
            <span class="machine-code">{{ m.code }}</span>
            <span class="badge" :class="getMachineStatusClass(m.status)">{{ m.status }}</span>
          </div>
        </div>
        <div v-else class="empty">暂无机器数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.task-list { display: flex; flex-direction: column; gap: 6px; }
.task-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border-light); }
.task-qty { margin-left: auto; font-size: 12px; color: var(--muted); }
.machine-list { display: flex; flex-direction: column; gap: 6px; }
.machine-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border-light); }
.machine-code { font-family: var(--font-mono); font-size: 13px; }
.empty { text-align: center; padding: 20px; color: var(--muted); font-size: 13px; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
</style>
