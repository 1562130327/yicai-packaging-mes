<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { workersApi, type Worker } from '@/api/workers'
import { api } from '@/api/request'

const auth = useAuthStore()
const workers = ref<Worker[]>([])
const selectedWorker = ref<string>('')
const tasks = ref<any[]>([])
const loading = ref(true)
const loadingTasks = ref(false)
const actionLoading = ref<string | null>(null)

// 师傅自动选自己
const isWorkerView = computed(() => auth.user?.role === 'worker')

function getPriorityClass(p: string) {
  return { deadline: 'priority-p0', urgent: 'priority-p1', normal: 'priority-p2', attention: 'priority-p3', unmentioned: 'priority-p4' }[p] || ''
}
function getPriorityLabel(p: string) {
  return { deadline: 'P0 紧急', urgent: 'P1 高', normal: 'P2 中', attention: 'P3 低', unmentioned: 'P4 最低' }[p] || p
}
function getStepTypeLabel(t: string) {
  return { cutting: '下料', slicing: '裁切', welding: '焊接', pressing: '压合', inspection: '检验', packaging: '入库' }[t] || t
}

async function loadTasks() {
  if (!selectedWorker.value) return
  loadingTasks.value = true
  try {
    const res = await workersApi.getTasks(selectedWorker.value)
    if (res.success) tasks.value = res.data.tasks || []
  } finally { loadingTasks.value = false }
}

// 操作：开始工序
async function startTask(task: any) {
  actionLoading.value = task.id
  try {
    await api.put('/processes/advance', { flowId: task.flowId, stepId: task.stepId, toStatus: 'running' })
    task.stepStatus = 'running'
  } finally { actionLoading.value = null }
}

// 操作：完成工序
async function completeTask(task: any) {
  actionLoading.value = task.id
  try {
    await api.post('/processes/complete', {
      flowId: task.flowId, stepId: task.stepId,
      quantity: task.requiredQty || 1, worker: auth.user?.name || 'unknown',
      defectQty: 0, notes: ''
    })
    tasks.value = tasks.value.filter(t => t.id !== task.id)
  } finally { actionLoading.value = null }
}

// 操作：反馈异常
async function feedbackTask(task: any) {
  const desc = prompt('请输入异常描述：')
  if (!desc) return
  actionLoading.value = task.id
  try {
    await api.post('/feedback', {
      orderId: task.orderId, processStepId: task.stepId, flowId: task.flowId,
      type: 'other', description: desc, severity: 'medium'
    })
    alert('反馈已提交，工序已暂停')
    loadTasks()
  } finally { actionLoading.value = null }
}

onMounted(async () => {
  try {
    // 管理员/跟单员需要选师傅，师傅自动加载自己的任务
    if (isWorkerView.value) {
      // 师傅：用用户名作为worker标识
      selectedWorker.value = auth.user?.id || ''
    } else {
      const res = await workersApi.list()
      if (res.success) workers.value = res.data
    }
  } finally { loading.value = false }

  if (selectedWorker.value) loadTasks()
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">{{ isWorkerView ? '📋 我的任务' : '📋 任务管理' }}</div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else>
      <!-- 管理员/跟单员：选择师傅 -->
      <div v-if="!isWorkerView" class="form-group" style="max-width: 300px; margin-bottom: 20px;">
        <label class="form-label">选择师傅</label>
        <select v-model="selectedWorker" class="form-input form-select" @change="loadTasks">
          <option value="">请选择...</option>
          <option v-for="w in workers" :key="w.id" :value="w.id">{{ w.name }} - {{ w.role }}</option>
        </select>
      </div>

      <div v-if="loadingTasks" class="loading">加载任务...</div>

      <div v-else-if="tasks.length === 0 && selectedWorker" class="empty">暂无任务</div>

      <div v-else class="tasks-list">
        <div v-for="task in tasks" :key="task.id" class="task-card card">
          <div class="task-header">
            <span class="priority" :class="getPriorityClass(task.priority)">{{ getPriorityLabel(task.priority) }}</span>
            <span class="task-code">{{ task.orderCode }}</span>
          </div>
          <div class="task-product">{{ task.productCode }}</div>
          <div class="task-meta">
            <span>{{ task.customerName }}</span>
            <span>{{ getStepTypeLabel(task.stepType) }}</span>
          </div>
          <div class="task-footer">
            <span class="badge" :class="task.stepStatus === 'running' ? 'badge-success' : 'badge-info'">
              {{ task.stepStatus === 'running' ? '进行中' : '待处理' }}
            </span>
            <div class="task-actions">
              <button v-if="task.stepStatus !== 'running'" class="btn btn-sm btn-primary"
                :disabled="actionLoading === task.id" @click="startTask(task)">
                {{ actionLoading === task.id ? '...' : '开始' }}
              </button>
              <button v-if="task.stepStatus === 'running'" class="btn btn-sm"
                :disabled="actionLoading === task.id" @click="completeTask(task)">
                {{ actionLoading === task.id ? '...' : '完成' }}
              </button>
              <button class="btn btn-sm" :disabled="actionLoading === task.id" @click="feedbackTask(task)">
                反馈
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.empty { text-align: center; padding: 40px; color: var(--muted); }
.tasks-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.task-card { padding: 14px; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.task-code { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
.task-product { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.task-meta { display: flex; gap: 12px; font-size: 12px; color: var(--fg-secondary); margin-bottom: 8px; }
.task-footer { display: flex; justify-content: space-between; align-items: center; }
.task-actions { display: flex; gap: 6px; }
</style>
