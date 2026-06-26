<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/api/request'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const feedbacks = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const submitting = ref(false)
const successMsg = ref('')

const form = ref({
  orderId: '',
  processStepId: '',
  flowId: '',
  type: 'other',
  description: '',
  severity: 'medium',
})

const feedbackTypes = [
  { value: 'material_quality', label: '材料质量问题' },
  { value: 'machine_failure', label: '机器故障' },
  { value: 'staff_shortage', label: '人员不足' },
  { value: 'other', label: '其他' },
]

const severityLevels = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
]

function getTypeLabel(t: string) {
  return feedbackTypes.find(f => f.value === t)?.label || t
}
function getSeverityLabel(s: string) {
  return severityLevels.find(l => l.value === s)?.label || s
}
function getSeverityClass(s: string) {
  return { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger' }[s] || ''
}

async function handleSubmit() {
  if (!form.value.description) {
    alert('请填写异常描述')
    return
  }
  submitting.value = true
  try {
    await api.post('/feedback', form.value)
    successMsg.value = '异常已上报'
    showForm.value = false
    form.value = { orderId: '', processStepId: '', flowId: '', type: 'other', description: '', severity: 'medium' }
    loadData()
    setTimeout(() => successMsg.value = '', 3000)
  } catch (e: any) {
    alert(e.message || '上报失败')
  } finally { submitting.value = false }
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get<{ success: boolean; data: any[] }>('/feedback')
    if (res.success) feedbacks.value = res.data
  } finally { loading.value = false }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">🚨 异常上报</div>
      <div class="section-actions">
        <button class="btn btn-primary" @click="showForm = !showForm">
          {{ showForm ? '取消' : '+ 上报异常' }}
        </button>
      </div>
    </div>

    <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

    <!-- 上报表单 -->
    <div v-if="showForm" class="card feedback-form" style="max-width: 600px; margin-bottom: 16px;">
      <h3 style="margin-bottom: 12px;">上报异常</h3>
      <div class="form-group">
        <label class="form-label">异常类型 *</label>
        <select v-model="form.type" class="form-input form-select">
          <option v-for="t in feedbackTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">严重程度</label>
        <select v-model="form.severity" class="form-input form-select">
          <option v-for="s in severityLevels" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">订单号（可选）</label>
        <input v-model="form.orderId" class="form-input" placeholder="关联的订单ID" />
      </div>
      <div class="form-group">
        <label class="form-label">异常描述 *</label>
        <textarea v-model="form.description" class="form-input" rows="3" placeholder="请详细描述异常情况..."></textarea>
      </div>
      <button class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '提交上报' }}
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="feedbacks.length === 0" class="empty">暂无异常记录</div>

    <div v-else class="feedback-list">
      <div v-for="fb in feedbacks" :key="fb.id" class="feedback-item card">
        <div class="feedback-header">
          <span class="badge" :class="getSeverityClass(fb.severity)">{{ getSeverityLabel(fb.severity) }}</span>
          <span class="feedback-type">{{ getTypeLabel(fb.type) }}</span>
          <span class="feedback-time">{{ fb.detected_at }}</span>
        </div>
        <div class="feedback-desc">{{ fb.description }}</div>
        <div class="feedback-meta" v-if="fb.order_code">订单: {{ fb.order_code }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.empty { text-align: center; padding: 40px; color: var(--muted); }
.success-msg { padding: 10px 16px; margin-bottom: 16px; background: var(--success-bg); color: var(--success); border-radius: var(--radius-sm); font-size: 13px; }
.feedback-form h3 { font-family: var(--font-display); }
textarea.form-input { resize: vertical; min-height: 80px; }
.feedback-list { display: flex; flex-direction: column; gap: 8px; }
.feedback-item { padding: 12px; }
.feedback-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.feedback-type { font-weight: 500; font-size: 13px; }
.feedback-time { font-size: 12px; color: var(--muted); margin-left: auto; }
.feedback-desc { font-size: 13px; color: var(--fg-secondary); margin-bottom: 4px; }
.feedback-meta { font-size: 12px; color: var(--muted); }
</style>
