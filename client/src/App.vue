<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()
</script>

<template>
  <AppLayout v-if="route.path !== '/login'">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
</template>
