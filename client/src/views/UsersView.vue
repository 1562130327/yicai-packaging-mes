<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/api/request'

const users = ref<any[]>([])
const loading = ref(true)

function getRoleLabel(r: string) {
  return { admin: '管理员', merchandiser: '跟单员', worker: '师傅' }[r] || r
}
function getRoleClass(r: string) {
  return { admin: 'badge-danger', merchandiser: 'badge-info', worker: 'badge-success' }[r] || ''
}

onMounted(async () => {
  try {
    const res = await api.get<{ success: boolean; data: any[] }>('/users')
    if (res.success) users.value = res.data
  } finally { loading.value = false }
})
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">👤 用户管理</div>
      <router-link to="/register" class="btn btn-primary">+ 注册新员工</router-link>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>工号</th>
            <th>姓名</th>
            <th>角色</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td><span class="mono">{{ user.username }}</span></td>
            <td>{{ user.name }}</td>
            <td><span class="badge" :class="getRoleClass(user.role)">{{ getRoleLabel(user.role) }}</span></td>
            <td><span class="badge" :class="user.enabled ? 'badge-success' : 'badge-warning'">{{ user.enabled ? '启用' : '禁用' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.mono { font-family: var(--font-mono); font-size: 13px; }
</style>
