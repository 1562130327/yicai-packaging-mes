<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { toasts } = useToast()
</script>

<template>
  <AppLayout v-if="route.path !== '/login'">
    <RouterView />
  </AppLayout>
  <RouterView v-else />

  <!-- Toast 通知容器 -->
  <div class="toast-container">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
