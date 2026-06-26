<script setup lang="ts">
const props = defineProps<{
  status: string
  type?: 'task' | 'machine' | 'order' | 'exception'
}>()

function getStatusLabel(s: string, type: string) {
  if (type === 'task') {
    return { pending: '待分配', assigned: '已分配', running: '进行中', completed: '已完成', paused: '已暂停', cancelled: '已取消' }[s] || s
  }
  if (type === 'machine') {
    return { running: '运行中', idle: '空闲', fault: '故障', maintenance: '维护中', offline: '离线' }[s] || s
  }
  if (type === 'order') {
    return { pending: '待排产', scheduled: '已排产', in_progress: '生产中', completed: '已完成', cancelled: '已取消' }[s] || s
  }
  if (type === 'exception') {
    return { open: '未解决', resolved: '已解决' }[s] || s
  }
  return s
}

function getStatusClass(s: string, type: string) {
  if (type === 'task') {
    return { pending: 'badge-warning', assigned: 'badge-info', running: 'badge-success', completed: '', paused: 'badge-danger', cancelled: '' }[s] || ''
  }
  if (type === 'machine') {
    return { running: 'badge-success', idle: 'badge-info', fault: 'badge-danger', maintenance: 'badge-warning', offline: '' }[s] || ''
  }
  if (type === 'order') {
    return { pending: 'badge-warning', scheduled: 'badge-info', in_progress: 'badge-success', completed: '', cancelled: '' }[s] || ''
  }
  if (type === 'exception') {
    return { open: 'badge-danger', resolved: 'badge-success' }[s] || ''
  }
  return ''
}
</script>

<template>
  <span class="badge" :class="getStatusClass(status, type || 'task')">{{ getStatusLabel(status, type || 'task') }}</span>
</template>
