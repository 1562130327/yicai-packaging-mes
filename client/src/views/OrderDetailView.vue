<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersApi, type Order, getOrderPriorityLabel, getOrderPriorityStyle, getOrderStatusLabel, getOrderStepTypeLabel, getOrderStepStatusLabel } from '@/api/orders'

const route = useRoute()
const router = useRouter()
const order = ref<Order | null>(null)
const loading = ref(true)

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
        <div class="info-row"><span class="label">客户</span><span>{{ order.customerName }}</span></div>
        <div class="info-row"><span class="label">产品</span><span>{{ order.productCode || '-' }}</span></div>
        <div class="info-row"><span class="label">材料</span><span>{{ order.materialSpec || '-' }}</span></div>
        <div class="info-row"><span class="label">优先级</span><span class="priority" :class="getOrderPriorityStyle(order.priority)">{{ getOrderPriorityLabel(order.priority) }}</span></div>
        <div class="info-row"><span class="label">状态</span><span>{{ getOrderStatusLabel(order.status) }}</span></div>
        <div class="info-row"><span class="label">交期</span><span>{{ order.dueDate || '-' }}</span></div>
        <div class="info-row"><span class="label">创建时间</span><span>{{ order.createdAt }}</span></div>
      </div>

      <!-- 工序流 -->
      <div class="card" v-if="order.steps?.length">
        <h3>工序流</h3>
        <div class="steps-list">
          <div v-for="step in order.steps" :key="step.id" class="step-item">
            <div class="step-seq">{{ step.sequence }}</div>
            <div class="step-info">
              <div class="step-name">{{ getOrderStepTypeLabel(step.type) }}</div>
              <div class="step-detail">{{ step.completedQty || 0 }}/{{ step.requiredQty || 0 }}</div>
            </div>
            <span class="badge" :class="step.status === 'done' ? 'badge-success' : step.status === 'running' ? 'badge-info' : ''">
              {{ getOrderStepStatusLabel(step.status) }}
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
