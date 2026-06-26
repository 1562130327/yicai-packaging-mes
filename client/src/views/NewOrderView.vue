<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi } from '@/api/orders'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = ref({
  productCode: '',
  customerName: '',
  category: '',
  processType: '',
  priority: 'normal',
  materialSpec: '',
  sheetSize: '',
  quantity: 100,
  dueDate: '',
})

async function handleSubmit() {
  if (!form.value.productCode || !form.value.customerName) {
    error.value = '请填写产品编号和客户名称'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await ordersApi.create(form.value)
    router.push('/orders')
  } catch (e: any) {
    error.value = e.message || '创建失败'
  } finally { loading.value = false }
}
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">📦 新建订单</div>
      <router-link to="/orders" class="btn">← 返回</router-link>
    </div>

    <div class="card" style="max-width: 600px;">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">产品编号 *</label>
          <input v-model="form.productCode" class="form-input" placeholder="例: EVA-38-001" />
        </div>

        <div class="form-group">
          <label class="form-label">客户名称 *</label>
          <input v-model="form.customerName" class="form-input" placeholder="例: 兴达" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">产品类别</label>
            <input v-model="form.category" class="form-input" placeholder="例: EVA包装" />
          </div>
          <div class="form-group">
            <label class="form-label">工艺类型</label>
            <input v-model="form.processType" class="form-input" placeholder="例: 标准工艺" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">优先级</label>
          <select v-model="form.priority" class="form-input form-select">
            <option value="unmentioned">P4 最低</option>
            <option value="attention">P3 低</option>
            <option value="normal">P2 中</option>
            <option value="urgent">P1 高</option>
            <option value="deadline">P0 紧急</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">材料规格</label>
          <input v-model="form.materialSpec" class="form-input" placeholder="例: 黑色38°BC料" />
        </div>

        <div class="form-group">
          <label class="form-label">交期 *</label>
          <input v-model="form.dueDate" type="date" class="form-input" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">片材尺寸</label>
            <input v-model="form.sheetSize" class="form-input" placeholder="例: 1000x500mm" />
          </div>
          <div class="form-group">
            <label class="form-label">数量</label>
            <input v-model.number="form.quantity" type="number" class="form-input" min="1" />
          </div>
        </div>

        <div v-if="error" class="login-error" style="margin-bottom: 16px;">{{ error }}</div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '创建中...' : '创建订单' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.login-error { padding: 8px 12px; background: var(--danger-bg); color: var(--danger); border-radius: var(--radius-sm); font-size: 13px; }
@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>
