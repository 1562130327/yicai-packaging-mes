import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isMerchandiser = computed(() => user.value?.role === 'merchandiser')
  const isWorker = computed(() => user.value?.role === 'worker')

  async function login(username: string, password: string) {
    const result = await authApi.login(username, password)
    if (result.success) {
      user.value = result.data
      token.value = result.data.token
      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data))
    }
    return result
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function loadUser() {
    const saved = localStorage.getItem('user')
    if (saved) {
      user.value = JSON.parse(saved)
    }
  }

  return { user, token, isAdmin, isMerchandiser, isWorker, login, logout, loadUser }
})
