<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const currentTime = ref('')
const isDark = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

function logout() {
  auth.logout()
  router.push('/login')
}

// 角色可见性配置
const allNavItems = [
  { path: '/', label: '看板', icon: '📊', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/orders', label: '订单', icon: '📦', roles: ['admin', 'merchandiser'] },
  { path: '/tasks', label: '任务', icon: '📋', roles: ['admin', 'worker'] },
  { path: '/machines', label: '机器', icon: '🏭', roles: ['admin'] },
  { path: '/workers', label: '人员', icon: '👥', roles: ['admin'] },
  { path: '/inventory', label: '库存', icon: '📦', roles: ['admin', 'merchandiser'] },
  { path: '/inbound', label: '入库', icon: '📥', roles: ['admin', 'merchandiser'] },
  { path: '/reports', label: '报表', icon: '📈', roles: ['admin', 'merchandiser'] },
  { path: '/feedback', label: '异常', icon: '🚨', roles: ['admin', 'worker'] },
  { path: '/users', label: '用户', icon: '👤', roles: ['admin'] },
]

const navItems = computed(() => {
  const role = auth.user?.role || ''
  return allNavItems.filter(item => item.roles.includes(role))
})

onMounted(() => {
  auth.loadUser()
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="app">
    <header class="header">
      <a href="/" class="header-brand">
        <div class="header-logo">溢</div>
        <span class="header-title">溢彩包装</span>
        <span class="header-subtitle">MES</span>
      </a>

      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          {{ item.icon }} {{ item.label }}
        </router-link>
      </nav>

      <div class="header-actions">
        <span class="header-time">{{ currentTime }}</span>
        <span class="header-role">{{ auth.user?.name }} ({{ auth.user?.role === 'admin' ? '管理员' : auth.user?.role === 'merchandiser' ? '跟单员' : '师傅' }})</span>
        <div class="header-user" @click="logout" title="退出登录">
          {{ auth.user?.name?.charAt(0) || 'U' }}
        </div>
      </div>
    </header>

    <main class="main">
      <slot />
    </main>
  </div>
</template>
