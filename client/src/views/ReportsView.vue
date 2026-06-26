<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/api/request'

const report = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await api.get<{ success: boolean; data: any }>('/reports/summary')
    if (res.success) report.value = res.data
  } finally { loading.value = false }
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">📈 报表中心</div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="report" class="reports-grid">
      <div class="card report-card">
        <div class="report-icon">📦</div>
        <div class="report-title">订单统计</div>
        <div class="report-stats">
          <div class="stat"><span class="stat-value">{{ report.orders.total }}</span><span class="stat-label">总订单</span></div>
          <div class="stat"><span class="stat-value">{{ report.orders.completed }}</span><span class="stat-label">已完成</span></div>
          <div class="stat"><span class="stat-value">{{ report.orders.pending }}</span><span class="stat-label">待处理</span></div>
        </div>
      </div>

      <div class="card report-card">
        <div class="report-icon">🏭</div>
        <div class="report-title">机器状态</div>
        <div class="report-stats">
          <div class="stat"><span class="stat-value">{{ report.machines.total }}</span><span class="stat-label">总机器</span></div>
          <div class="stat"><span class="stat-value">{{ report.machines.running }}</span><span class="stat-label">运行中</span></div>
        </div>
      </div>

      <div class="card report-card">
        <div class="report-icon">👥</div>
        <div class="report-title">人员</div>
        <div class="report-stats">
          <div class="stat"><span class="stat-value">{{ report.workers }}</span><span class="stat-label">在岗人员</span></div>
        </div>
      </div>

      <div class="card report-card">
        <div class="report-icon">⚠️</div>
        <div class="report-title">异常</div>
        <div class="report-stats">
          <div class="stat"><span class="stat-value">{{ report.anomalies }}</span><span class="stat-label">异常事件</span></div>
          <div class="stat"><span class="stat-value">{{ report.completions }}</span><span class="stat-label">完成记录</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.report-card { text-align: center; padding: 24px; }
.report-icon { font-size: 32px; margin-bottom: 8px; }
.report-title { font-family: var(--font-display); font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.report-stats { display: flex; justify-content: center; gap: 24px; }
.stat { display: flex; flex-direction: column; }
.stat-value { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 12px; color: var(--muted); }
</style>
