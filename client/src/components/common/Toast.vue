<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const visible = ref(true)

onMounted(() => {
  setTimeout(() => {
    visible.value = false
    emit('close')
  }, props.duration || 3000)
})
</script>

<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="'toast-' + (type || 'info')">
      <span class="toast-icon">{{ type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ' }}</span>
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease;
}
.toast-success { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
.toast-error { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger); }
.toast-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning); }
.toast-info { background: var(--info-bg); color: var(--info); border: 1px solid var(--info); }
.toast-icon { font-size: 16px; }
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
</style>
