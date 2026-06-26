<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { inventoryApi, type InventoryItem } from '@/api/inventory'

const inventory = ref<InventoryItem[]>([])
const loading = ref(true)

function getLevelClass(level: string, qty: number) {
  if (qty < 50) return 'badge-danger'
  if (qty < 100) return 'badge-warning'
  return 'badge-success'
}

onMounted(async () => {
  try {
    const res = await inventoryApi.list()
    if (res.success) inventory.value = res.data
  } finally { loading.value = false }
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">📦 库存管理</div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>批次号</th>
            <th>材料规格</th>
            <th>供应商</th>
            <th>颜色</th>
            <th>剩余数量</th>
            <th>单位</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventory" :key="item.id">
            <td><span class="mono">{{ item.batchNo }}</span></td>
            <td>{{ item.materialSpec }}</td>
            <td>{{ item.supplierName || '-' }}</td>
            <td>{{ item.color || '-' }}</td>
            <td>{{ item.remainingQty }}</td>
            <td>{{ item.unit }}</td>
            <td>
              <span class="badge" :class="getLevelClass('', item.remainingQty)">
                {{ item.remainingQty < 50 ? '不足' : item.remainingQty < 100 ? '偏低' : '充足' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.mono { font-family: var(--font-mono); font-size: 13px; }
</style>
