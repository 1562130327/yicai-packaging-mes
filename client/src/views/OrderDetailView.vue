<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersApi, type Order } from '@/api/orders'

const route = useRoute()
const router = useRouter()
const order = ref<any>(null)
const loading = ref(true)

function getPriorityClass(p: string) {
  return { deadline: 'priority-p0', urgent: 'priority-p1', normal: 'priority-p2', attention: 'priority-p3', unmentioned: 'priority-p4' }[p] || ''
}
function getPriorityLabel(p: string) {
  return { deadline: 'P0 紧急', urgent: 'P1 高', normal: 'P2 中', attention: 'P3 低', unmentioned: 'P4 最低' }[p] || p
}
function getStatusLabel(s: string) {
  return { pending: '待排产', scheduled: '已排产', in_progress: '生产中', completed: '已完成', cancelled: '已取消' }[s] || s
}
function getStepTypeLabel(t: string) {
  return { cutting: '下料', slicing: '裁切', welding: '焊接', pressing: '压合', inspection: '检验', packaging: '入库' }[t] || t
}
function getStepStatusLabel(s: string) {
  return { waiting: '等待', ready: '就绪', running: '进行中', done: '已完成', paused: '已暂停' }[s] || s
}

onMounted(async () => {
  try {
    const res = await ordersApi.get(route.params.id as string)
    if (res.success) order.value = res.data
  } finally { loading.value = false }
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">📦 订单详情</div>
      <router-link to="/orders" class="btn">← 返回</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="order" class="detail-grid">
      <!-- 基本信息 -->
      <div class="card info-card">
        <h3>{{ order.code }}</h3>
        <div class="info-row"><span class="label">客户</span><span>{{ order.customer_name }}</span></div>
        <div class="info-row"><span class="label">产品</span><span>{{ order.product_code || '-' }}</span></div>
        <div class="info-row"><span class="label">材料</span><span>{{ order.material_spec || '-' }}</span></div>
        <div class="info-row"><span class="label">优先级</span><span class="priority" :class="getPriorityClass(order.priority)">{{ getPriorityLabel(order.priority) }}</span></div>
        <div class="info-row"><span class="label">状态</span><span>{{ getStatusLabel(order.status) }}</span></div>
        <div class="info-row"><span class="label">交期</span><span>{{ order.due_date || '-' }}</span></div>
        <div class="info-row"><span class="label">创建时间</span><span>{{ order.created_at }}</span></div>
      </div>

      <!-- 工序流 -->
      <div class="card" v-if="order.steps?.length">
        <h3>工序流</h3>
        <div class="steps-list">
          <div v-for="step in order.steps" :key="step.id" class="step-item">
            <div class="step-seq">{{ step.sequence }}</div>
            <div class="step-info">
              <div class="step-name">{{ getStepTypeLabel(step.type) }}</div>
              <div class="step-detail">{{ step.completed_qty || 0 }}/{{ step.required_qty || 0 }}</div>
            </div>
            <span class="badge" :class="step.status === 'done' ? 'badge-success' : step.status === 'running' ? 'badge-info' : ''">
              {{ getStepStatusLabel(step.status) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-card h3 { margin-bottom: 12px; }
.info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-light); font-size: 13px; }
.label { color: var(--muted); }
.steps-list { display: flex; flex-direction: column; gap: 8px; }
.step-item { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: var(--radius-sm); }
.step-item:hover { background: var(--surface-alt); }
.step-seq { width: 28px; height: 28px; border-radius: 50%; background: var(--accent-light); color: var(--accent-dark); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
.step-info { flex: 1; }
.step-name { font-weight: 500; font-size: 13px; }
.step-detail { font-size: 12px; color: var(--muted); }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
