<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { exceptionsApi, type Exception } from '@/api/exceptions'

const exceptions = ref<Exception[]>([])
const loading = ref(true)
const showForm = ref(false)
const submitting = ref(false)
const successMsg = ref('')

const form = ref({
  taskId: '',
  type: 'other',
  severity: 'medium',
  description: '',
})

const feedbackTypes = [
  { value: 'material_quality', label: '材料质量问题' },
  { value: 'machine_failure', label: '机器故障' },
  { value: 'staff_shortage', label: '人员不足' },
  { value: 'process_issue', label: '工艺问题' },
  { value: 'other', label: '其他' },
]

function getTypeLabel(t: string) { return feedbackTypes.find(f => f.value === t)?.label || t }
function getSeverityLabel(s: string) { return { low: '低', medium: '中', high: '高' }[s] || s }
function getSeverityClass(s: string) { return { low: 'badge-info', medium: 'badge-warning', high: 'badge-danger' }[s] || '' }

async function handleSubmit() {
  if (!form.value.taskId || !form.value.description) {
    alert('任务ID和描述为必填')
    return
  }
  submitting.value = true
  try {
    await exceptionsApi.create(form.value)
    successMsg.value = '异常已上报'
    showForm.value = false
    form.value = { taskId: '', type: 'other', severity: 'medium', description: '' }
    await loadData()
    setTimeout(() => successMsg.value = '', 3000)
  } catch (e: any) {
    alert(e.message || '上报失败')
  } finally { submitting.value = false }
}

async function handleResolve(id: string) {
  const resolution = prompt('解决方案：')
  if (!resolution) return
  await exceptionsApi.resolve(id, resolution)
  await loadData()
}

async function loadData() {
  loading.value = true
  try {
    const res = await exceptionsApi.list()
    if (res.success) exceptions.value = res.data
  } finally { loading.value = false }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">🚨 异常上报</div>
      <button class="btn btn-primary" @click="showForm = !showForm">{{ showForm ? '取消' : '+ 上报异常' }}</button>
    </div>

    <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

    <div v-if="showForm" class="card" style="max-width:600px;margin-bottom:16px">
      <h3>上报异常</h3>
      <div class="form-group"><label class="form-label">任务ID *</label><input v-model="form.taskId" class="form-input" placeholder="关联的任务ID" /></div>
      <div class="form-group"><label class="form-label">异常类型</label><select v-model="form.type" class="form-input form-select"><option v-for="t in feedbackTypes" :key="t.value" :value="t.value">{{ t.label }}</option></select></div>
      <div class="form-group"><label class="form-label">严重程度</label><select v-model="form.severity" class="form-input form-select"><option value="low">低</option><option value="medium">中</option><option value="high">高（自动暂停任务）</option></select></div>
      <div class="form-group"><label class="form-label">描述 *</label><textarea v-model="form.description" class="form-input" rows="3" placeholder="详细描述异常情况..."></textarea></div>
      <button class="btn btn-primary" :disabled="submitting" @click="handleSubmit">{{ submitting ? '提交中...' : '提交上报' }}</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="exceptions.length === 0" class="empty">暂无异常记录</div>
    <div v-else class="exception-list">
      <div v-for="ex in exceptions" :key="ex.id" class="exception-item card">
        <div class="exception-header">
          <span class="badge" :class="getSeverityClass(ex.severity)">{{ getSeverityLabel(ex.severity) }}</span>
          <span class="exception-type">{{ getTypeLabel(ex.type) }}</span>
          <span class="badge" :class="ex.status === 'open' ? 'badge-danger' : 'badge-success'">{{ ex.status === 'open' ? '未解决' : '已解决' }}</span>
          <span class="exception-time">{{ ex.detectedAt }}</span>
        </div>
        <div class="exception-desc">{{ ex.description }}</div>
        <button v-if="ex.status === 'open'" class="btn btn-sm" @click="handleResolve(ex.id)">标记解决</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.empty { text-align: center; padding: 40px; color: var(--muted); }
.success-msg { padding: 10px 16px; margin-bottom: 16px; background: var(--success-bg); color: var(--success); border-radius: var(--radius-sm); font-size: 13px; }
textarea.form-input { resize: vertical; min-height: 80px; }
.exception-list { display: flex; flex-direction: column; gap: 8px; }
.exception-item { padding: 12px; }
.exception-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.exception-type { font-weight: 500; font-size: 13px; }
.exception-time { font-size: 12px; color: var(--muted); margin-left: auto; }
.exception-desc { font-size: 13px; color: var(--fg-secondary); margin-bottom: 8px; }
</style>
