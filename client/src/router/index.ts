import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser', 'worker'] } },
  { path: '/orders', name: 'orders', component: () => import('@/views/OrdersView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser'] } },
  { path: '/orders/new', name: 'new-order', component: () => import('@/views/NewOrderView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser'] } },
  { path: '/orders/:id', name: 'order-detail', component: () => import('@/views/OrderDetailView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser'] } },
  { path: '/tasks', name: 'tasks', component: () => import('@/views/TasksView.vue'), meta: { requiresAuth: true, roles: ['admin', 'worker'] } },
  { path: '/machines', name: 'machines', component: () => import('@/views/MachinesView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/workers', name: 'workers', component: () => import('@/views/WorkersView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/inventory', name: 'inventory', component: () => import('@/views/InventoryView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser'] } },
  { path: '/inbound', name: 'inbound', component: () => import('@/views/InboundView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser'] } },
  { path: '/reports', name: 'reports', component: () => import('@/views/ReportsView.vue'), meta: { requiresAuth: true, roles: ['admin', 'merchandiser'] } },
  { path: '/users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/feedback', name: 'feedback', component: () => import('@/views/FeedbackView.vue'), meta: { requiresAuth: true, roles: ['admin', 'worker'] } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const saved = localStorage.getItem('user')
  let user: { role?: string } | null = null
  try {
    user = saved ? JSON.parse(saved) : null
  } catch {
    localStorage.removeItem('user')
  }

  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.path === '/login' && token) {
    next('/')
    return
  }

  // 角色权限检查 — 使用 meta.roles 匹配，支持动态路由参数
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && user && !allowedRoles.includes(user.role ?? '')) {
    next('/') // 无权限则跳回看板
    return
  }

  next()
})

export default router
