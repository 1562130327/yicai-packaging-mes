<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入工号和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">溢彩</div>
      <h1 class="login-title">生产执行系统</h1>
      <p class="login-subtitle">EVA 片材包装 MES</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">工号</label>
          <input
            v-model="username"
            type="text"
            class="form-input"
            placeholder="请输入工号"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 40px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.login-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: var(--accent);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 24px;
  font-family: var(--font-display);
}

.login-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 24px;
}

.login-form {
  text-align: left;
}

.login-error {
  padding: 8px 12px;
  margin-bottom: 16px;
  background: var(--danger-bg);
  color: var(--danger);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.login-btn {
  width: 100%;
  padding: 10px;
  font-size: 14px;
}

.register-link {
  margin-top: 16px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.register-link a {
  color: var(--accent);
  text-decoration: none;
}
</style>
