<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { inventoryApi, type InventoryItem } from '@/api/inventory'
import { api } from '@/api/request'

const inventory = ref<InventoryItem[]>([])
const loading = ref(true)
const showForm = ref(false)
const submitting = ref(false)
const successMsg = ref('')

const form = ref({
  batchNo: '',
  materialSpec: '',
  supplierName: '',
  color: '',
  remainingQty: 0,
  unit: '张',
  price: 0,
})

async function handleInbound() {
  if (!form.value.batchNo || !form.value.materialSpec) {
    alert('批次号和材料规格为必填')
    return
  }
  submitting.value = true
  try {
    await api.post('/inventory', form.value)
    successMsg.value = `入库成功：${form.value.batchNo}`
    showForm.value = false
    form.value = { batchNo: '', materialSpec: '', supplierName: '', color: '', remainingQty: 0, unit: '张', price: 0 }
    loadData()
    setTimeout(() => successMsg.value = '', 3000)
  } catch (e: any) {
    alert(e.message || '入库失败')
  } finally { submitting.value = false }
}

async function loadData() {
  loading.value = true
  try {
    const res = await inventoryApi.list()
    if (res.success) inventory.value = res.data
  } finally { loading.value = false }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">📥 入库管理</div>
      <div class="section-actions">
        <button class="btn btn-primary" @click="showForm = !showForm">
          {{ showForm ? '取消' : '+ 入库登记' }}
        </button>
      </div>
    </div>

    <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

    <!-- 入库表单 -->
    <div v-if="showForm" class="card inbound-form" style="max-width: 600px; margin-bottom: 16px;">
      <h3 style="margin-bottom: 12px;">入库登记</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">批次号 *</label>
          <input v-model="form.batchNo" class="form-input" placeholder="例: B2024-001" />
        </div>
        <div class="form-group">
          <label class="form-label">材料规格 *</label>
          <input v-model="form.materialSpec" class="form-input" placeholder="例: 黑色38°BC料" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">供应商</label>
          <input v-model="form.supplierName" class="form-input" placeholder="例: 宏泰" />
        </div>
        <div class="form-group">
          <label class="form-label">颜色</label>
          <input v-model="form.color" class="form-input" placeholder="例: 黑色" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">入库数量 *</label>
          <input v-model.number="form.remainingQty" type="number" class="form-input" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label">单位</label>
          <select v-model="form.unit" class="form-input form-select">
            <option value="张">张</option>
            <option value="卷">卷</option>
            <option value="桶">桶</option>
            <option value="公斤">公斤</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">单价</label>
        <input v-model.number="form.price" type="number" class="form-input" min="0" step="0.01" />
      </div>
      <button class="btn btn-primary" :disabled="submitting" @click="handleInbound">
        {{ submitting ? '提交中...' : '确认入库' }}
      </button>
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
              <span class="badge" :class="item.remainingQty < 50 ? 'badge-danger' : item.remainingQty < 100 ? 'badge-warning' : 'badge-success'">
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
.success-msg { padding: 10px 16px; margin-bottom: 16px; background: var(--success-bg); color: var(--success); border-radius: var(--radius-sm); font-size: 13px; }
.inbound-form h3 { font-family: var(--font-display); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>
