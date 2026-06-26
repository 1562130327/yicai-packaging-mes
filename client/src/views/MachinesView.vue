<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { machinesApi, type Machine, getMachineStatusLabel } from '@/api/machines'

const machines = ref<Machine[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await machinesApi.list()
    if (res.success) machines.value = res.data
  } finally { loading.value = false }
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">🏭 机器管理</div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="machines-grid">
      <div v-for="m in machines" :key="m.id" class="machine-card card">
        <div class="machine-header">
          <div class="machine-code">{{ m.code }}</div>
          <span class="status-dot" :class="m.status"></span>
        </div>
        <div class="machine-name">{{ m.name }}</div>
        <div class="machine-type">{{ m.type }}</div>
        <div class="machine-status-text">{{ getMachineStatusLabel(m.status) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.machines-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.machine-card { padding: 16px; }
.machine-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.machine-code { font-family: var(--font-mono); font-weight: 600; font-size: 14px; }
.machine-name { font-size: 13px; color: var(--fg-secondary); margin-bottom: 4px; }
.machine-type { font-size: 12px; color: var(--muted); }
.machine-status-text { font-size: 12px; margin-top: 8px; font-weight: 500; }
</style>
