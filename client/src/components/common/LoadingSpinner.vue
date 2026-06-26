<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  text?: string
}>()
</script>

<template>
  <div class="loading-spinner" :class="'loading-' + (size || 'md')">
    <div class="spinner"></div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--muted);
}
.spinner {
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-sm .spinner { width: 16px; height: 16px; }
.loading-md .spinner { width: 24px; height: 24px; }
.loading-lg .spinner { width: 36px; height: 36px; }
.loading-text { font-size: 13px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
