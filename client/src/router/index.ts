import { createRouter, createWebHistory } from 'vue-router'

// 角色权限配置
const roleMap: Record<string, string[]> = {
  '/': ['admin', 'merchandiser', 'worker'],
  '/orders': ['admin', 'merchandiser'],
  '/orders/new': ['admin', 'merchandiser'],
  '/orders/:id': ['admin', 'merchandiser'],
  '/tasks': ['admin', 'worker'],
  '/machines': ['admin'],
  '/workers': ['admin'],
  '/inventory': ['admin', 'merchandiser'],
  '/inbound': ['admin', 'merchandiser'],
  '/reports': ['admin', 'merchandiser'],
  '/users': ['admin'],
  '/feedback': ['admin', 'worker'],
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/orders', name: 'orders', component: () => import('@/views/OrdersView.vue'), meta: { requiresAuth: true } },
    { path: '/orders/new', name: 'new-order', component: () => import('@/views/NewOrderView.vue'), meta: { requiresAuth: true } },
    { path: '/orders/:id', name: 'order-detail', component: () => import('@/views/OrderDetailView.vue'), meta: { requiresAuth: true } },
    { path: '/tasks', name: 'tasks', component: () => import('@/views/TasksView.vue'), meta: { requiresAuth: true } },
    { path: '/machines', name: 'machines', component: () => import('@/views/MachinesView.vue'), meta: { requiresAuth: true } },
    { path: '/workers', name: 'workers', component: () => import('@/views/WorkersView.vue'), meta: { requiresAuth: true } },
    { path: '/inventory', name: 'inventory', component: () => import('@/views/InventoryView.vue'), meta: { requiresAuth: true } },
    { path: '/inbound', name: 'inbound', component: () => import('@/views/InboundView.vue'), meta: { requiresAuth: true } },
    { path: '/reports', name: 'reports', component: () => import('@/views/ReportsView.vue'), meta: { requiresAuth: true } },
    { path: '/users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { requiresAuth: true } },
    { path: '/feedback', name: 'feedback', component: () => import('@/views/FeedbackView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const saved = localStorage.getItem('user')
  const user = saved ? JSON.parse(saved) : null

  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.path === '/login' && token) {
    next('/')
    return
  }

  // 角色权限检查
  const allowedRoles = roleMap[to.path]
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    next('/') // 无权限则跳回看板
    return
  }

  next()
})

export default router
