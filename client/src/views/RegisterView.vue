<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/request'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  gender: 'male',
  role: 'worker',
})

const roles = [
  { value: 'admin', label: '管理员' },
  { value: 'merchandiser', label: '跟单员' },
  { value: 'worker', label: '师傅' },
]

async function handleRegister() {
  if (!form.value.username || !form.value.password || !form.value.name) {
    error.value = '请填写工号、密码、姓名'
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次密码不一致'
    return
  }
  if (form.value.password.length < 4) {
    error.value = '密码至少4位'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await api.post('/users/register', form.value)
    router.push('/login')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  } finally { loading.value = false }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">溢</div>
      <h1 class="login-title">员工注册</h1>
      <p class="login-subtitle">溢彩包装 MES</p>

      <form @submit.prevent="handleRegister" class="login-form">
        <div class="form-group">
          <label class="form-label">工号 *</label>
          <input v-model="form.username" class="form-input" placeholder="请输入工号" :disabled="loading" />
        </div>

        <div class="form-group">
          <label class="form-label">姓名 *</label>
          <input v-model="form.name" class="form-input" placeholder="请输入真实姓名" :disabled="loading" />
        </div>

        <div class="form-group">
          <label class="form-label">性别</label>
          <select v-model="form.gender" class="form-input form-select" :disabled="loading">
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">岗位</label>
          <select v-model="form.role" class="form-input form-select" :disabled="loading">
            <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">密码 *</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="请输入密码" :disabled="loading" />
        </div>

        <div class="form-group">
          <label class="form-label">确认密码 *</label>
          <input v-model="form.confirmPassword" type="password" class="form-input" placeholder="请再次输入密码" :disabled="loading" />
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>

        <div class="register-link">
          已有账号？<router-link to="/login">去登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.login-card { width: 100%; max-width: 360px; padding: 40px; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-lg); text-align: center; }
.login-logo { width: 64px; height: 64px; margin: 0 auto 16px; background: var(--accent); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 24px; }
.login-title { font-family: var(--font-display); font-size: 20px; font-weight: 600; margin-bottom: 4px; }
.login-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 24px; }
.login-form { text-align: left; }
.login-error { padding: 8px 12px; margin-bottom: 16px; background: var(--danger-bg); color: var(--danger); border-radius: var(--radius-sm); font-size: 13px; }
.login-btn { width: 100%; padding: 10px; font-size: 14px; }
.register-link { margin-top: 16px; font-size: 13px; color: var(--muted); text-align: center; }
.register-link a { color: var(--accent); text-decoration: none; }
</style>
