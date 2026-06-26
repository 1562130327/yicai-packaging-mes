<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function getPriorityClass(priority: string) {
  const map: Record<string, string> = {
    deadline: 'priority-p0',
    urgent: 'priority-p1',
    normal: 'priority-p2',
    attention: 'priority-p3',
    unmentioned: 'priority-p4',
  }
  return map[priority] || ''
}

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    deadline: 'P0 紧急',
    urgent: 'P1 高',
    normal: 'P2 中',
    attention: 'P3 低',
    unmentioned: 'P4 最低',
  }
  return map[priority] || priority
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    running: 'badge-success',
    idle: 'badge-info',
    fault: 'badge-danger',
    maintenance: 'badge-warning',
    offline: '',
  }
  return map[status] || ''
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    running: '运行中',
    idle: '空闲',
    fault: '故障',
    maintenance: '维护中',
    offline: '离线',
  }
  return map[status] || status
}

function getPipelineStageName(stage: string) {
  const map: Record<string, string> = {
    cutting: '下料',
    slicing: '裁切',
    welding: '焊接',
    pressing: '压合',
    inspection: '检验',
    packaging: '入库',
  }
  return map[stage] || stage
}

onMounted(() => {
  store.fetchData()
  updateTime()
  timer = setInterval(updateTime, 1000)
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
      <div class="kpi-card kpi-warning" v-if="(store.data?.kpi.inventoryAlerts || 0) > 0">
        <div class="kpi-label">⚠️ 库存预警</div>
        <div class="kpi-value" style="color:var(--warning)">{{ store.data?.kpi.inventoryAlerts || 0 }}</div>
        <div class="kpi-change">其中 {{ store.data?.kpi.criticalInventory || 0 }} 项严重不足</div>
      </div>
      <div class="kpi-card kpi-danger" v-if="(store.data?.kpi.anomalyCount || 0) > 0">
        <div class="kpi-label">🚨 异常事件</div>
        <div class="kpi-value" style="color:var(--danger)">{{ store.data?.kpi.anomalyCount || 0 }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">产线利用率</div>
        <div class="kpi-value">{{ store.data?.kpi.machineUtilization || '0%' }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">在岗人员</div>
        <div class="kpi-value">{{ store.data?.kpi.personnelOnDuty || 0 }}</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
      <!-- Orders Panel -->
      <div class="card orders-panel">
        <div class="card-header">
          <div class="card-title">📦 订单池</div>
          <span class="badge badge-info">{{ store.data?.orders.length || 0 }} 单</span>
        </div>
        <div class="orders-list">
          <div
            v-for="order in store.data?.orders"
            :key="order.id"
            class="order-item"
          >
            <div class="order-header">
              <span class="order-code">{{ order.code }}</span>
              <span class="priority" :class="getPriorityClass(order.priority)">
                {{ getPriorityLabel(order.priority) }}
              </span>
            </div>
            <div class="order-product">{{ order.productCode }}</div>
            <div class="order-meta">
              <span>{{ order.customerName }}</span>
              <span>{{ order.materialSpec }}</span>
              <span>{{ order.quantity }}件</span>
            </div>
            <div class="order-footer">
              <span class="badge" :class="order.status === 'delayed' ? 'badge-danger' : 'badge-success'">
                {{ order.status === 'delayed' ? '延期' : '进行中' }}
              </span>
              <span class="order-due">交期 {{ order.dueDate }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <!-- Machines -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🏭 机器状态</div>
            <span class="badge badge-success">
              {{ store.data?.machines.filter(m => m.status === 'running').length || 0 }} 运行中
            </span>
          </div>
          <div class="machines-grid">
            <div
              v-for="machine in store.data?.machines"
              :key="machine.id"
              class="machine-item"
            >
              <div class="machine-status">
                <span class="status-dot" :class="machine.status"></span>
                <span class="machine-code">{{ machine.code }}</span>
              </div>
              <div class="machine-type">{{ machine.type }}</div>
              <div class="machine-name">{{ machine.name }}</div>
            </div>
          </div>
        </div>

        <!-- Personnel -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">👥 人员在岗</div>
          </div>
          <div class="personnel-list">
            <div
              v-for="worker in store.data?.workers"
              :key="worker.id"
              class="personnel-item"
            >
              <div class="personnel-avatar">{{ worker.name.charAt(0) }}</div>
              <div class="personnel-info">
                <div class="personnel-name">{{ worker.name }}</div>
                <div class="personnel-role">{{ worker.role }} · {{ worker.team }}</div>
              </div>
              <span class="badge badge-success">在岗</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pipeline -->
    <div class="card pipeline-card">
      <div class="card-header">
        <div class="card-title">🔄 工序流 Pipeline</div>
      </div>
      <div class="pipeline">
        <template v-for="(stage, index) in store.data?.pipeline" :key="stage.stage">
          <div class="pipeline-stage">
            <div class="pipeline-stage-count">{{ stage.count }}</div>
            <div class="pipeline-stage-name">{{ getPipelineStageName(stage.stage) }}</div>
          </div>
          <span v-if="index < (store.data?.pipeline.length || 0) - 1" class="pipeline-arrow">→</span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.orders-panel {
  max-height: 480px;
  overflow-y: auto;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item {
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  transition: all var(--transition);
}

.order-item:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.order-code {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}

.order-product {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.order-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--fg-secondary);
  margin-bottom: 8px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-due {
  font-size: 12px;
  color: var(--muted);
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.machines-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.machine-item {
  padding: 10px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
}

.machine-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.machine-code {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}

.machine-type {
  font-size: 11px;
  color: var(--muted);
}

.machine-name {
  font-size: 12px;
  color: var(--fg-secondary);
  margin-top: 2px;
}

.personnel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.personnel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: var(--radius-sm);
}

.personnel-item:hover {
  background: var(--surface-alt);
}

.personnel-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-light);
  color: var(--accent-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
}

.personnel-info {
  flex: 1;
}

.personnel-name {
  font-weight: 500;
  font-size: 13px;
}

.personnel-role {
  font-size: 12px;
  color: var(--muted);
}

.pipeline-card {
  margin-top: 0;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .machines-grid {
    grid-template-columns: 1fr;
  }
}
</style>
