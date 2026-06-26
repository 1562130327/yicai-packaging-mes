<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { workersApi, type Worker, getWorkerStatusLabel } from '@/api/workers'

const workers = ref<Worker[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await workersApi.list()
    if (res.success) workers.value = res.data
  } finally { loading.value = false }
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">👥 人员管理</div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="workers-grid">
      <div v-for="w in workers" :key="w.id" class="worker-card card">
        <div class="worker-avatar">{{ w.name.charAt(0) }}</div>
        <div class="worker-info">
          <div class="worker-name">{{ w.name }}</div>
          <div class="worker-role">{{ w.role }}</div>
        </div>
        <span class="badge badge-success">{{ getWorkerStatusLabel(w.status) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.workers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.worker-card { display: flex; align-items: center; gap: 12px; padding: 14px; }
.worker-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-light); color: var(--accent-dark); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; flex-shrink: 0; }
.worker-info { flex: 1; }
.worker-name { font-weight: 600; font-size: 14px; }
.worker-role { font-size: 12px; color: var(--muted); }
</style>
