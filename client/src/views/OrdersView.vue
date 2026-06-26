<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi, type Order, getOrderPriorityLabel, getOrderPriorityStyle, getOrderStatusLabel, getOrderStatusStyle } from '@/api/orders'

const router = useRouter()
const orders = ref<Order[]>([])
const loading = ref(true)
const editingOrder = ref<Order | null>(null)
const editForm = ref<Partial<Order>>({})
const showEditModal = ref(false)

// 筛选
const filterPriority = ref('')
const filterStatus = ref('')
const searchQuery = ref('')

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    if (filterPriority.value && o.priority !== filterPriority.value) return false
    if (filterStatus.value && o.status !== filterStatus.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!o.code?.toLowerCase().includes(q) && !o.customerName?.toLowerCase().includes(q) && !o.productCode?.toLowerCase().includes(q)) return false
    }
    return true
  })
})
function getDaysLeft(date: string) {
  if (!date) return '-'
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `已超期${Math.abs(diff)}天`
  if (diff === 0) return '今天到期'
  return `还剩${diff}天`
}
function getDaysLeftClass(date: string) {
  if (!date) return ''
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'text-danger'
  if (diff <= 3) return 'text-warning'
  return ''
}

function viewDetail(order: Order) {
  router.push(`/orders/${order.id}`)
}

function openEdit(order: Order) {
  editingOrder.value = order
  editForm.value = { ...order }
  showEditModal.value = true
}

async function saveEdit() {
  if (!editingOrder.value) return
  try {
    await ordersApi.update(editingOrder.value.id, editForm.value)
    showEditModal.value = false
    loadData()
  } catch (e: any) { alert(e.message) }
}

async function deleteOrder(order: Order) {
  if (!confirm(`确定删除订单 ${order.code}？`)) return
  try {
    await ordersApi.delete(order.id)
    loadData()
  } catch (e: any) { alert(e.message) }
}

async function loadData() {
  loading.value = true
  try {
    const res = await ordersApi.list()
    if (res.success) orders.value = res.data
  } finally { loading.value = false }
}

onMounted(loadData)
</script>

<template>
  <div>
    <div class="section-header">
      <div class="section-title">📦 订单管理</div>
      <div class="section-actions">
        <router-link to="/orders/new" class="btn btn-primary">+ 新建订单</router-link>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar card">
      <input v-model="searchQuery" class="form-input" placeholder="搜索订单号/客户/产品..." style="max-width:250px" />
      <select v-model="filterPriority" class="form-input form-select" style="max-width:150px">
        <option value="">全部优先级</option>
        <option value="deadline">P0 紧急</option>
        <option value="urgent">P1 高</option>
        <option value="normal">P2 中</option>
        <option value="attention">P3 低</option>
        <option value="unmentioned">P4 最低</option>
      </select>
      <select v-model="filterStatus" class="form-input form-select" style="max-width:150px">
        <option value="">全部状态</option>
        <option value="pending">待排产</option>
        <option value="scheduled">已排产</option>
        <option value="in_progress">生产中</option>
        <option value="completed">已完成</option>
        <option value="cancelled">已取消</option>
      </select>
      <span class="filter-count">{{ filteredOrders.length }} / {{ orders.length }} 条</span>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>产品</th>
            <th>优先级</th>
            <th>交期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" class="clickable" @click="viewDetail(order)">
            <td><span class="mono">{{ order.code }}</span></td>
            <td>{{ order.customerName }}</td>
            <td>{{ order.productCode || '-' }}</td>
            <td><span class="priority" :class="getOrderPriorityStyle(order.priority)">{{ getOrderPriorityLabel(order.priority) }}</span></td>
            <td :class="getDaysLeftClass(order.dueDate)">{{ getDaysLeft(order.dueDate) }}</td>
            <td><span class="badge" :class="getOrderStatusStyle(order.status)">{{ getOrderStatusLabel(order.status) }}</span></td>
            <td @click.stop>
              <div class="action-btns">
                <button class="btn btn-sm" @click="openEdit(order)">编辑</button>
                <button class="btn btn-sm" style="color:var(--danger)" @click="deleteOrder(order)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal card">
        <h3>编辑订单 {{ editingOrder?.code }}</h3>
        <div class="form-group"><label class="form-label">产品编号</label><input v-model="editForm.productCode" class="form-input" /></div>
        <div class="form-group"><label class="form-label">客户名称</label><input v-model="editForm.customerName" class="form-input" /></div>
        <div class="form-group"><label class="form-label">优先级</label>
          <select v-model="editForm.priority" class="form-input form-select">
            <option value="unmentioned">P4 最低</option><option value="attention">P3 低</option>
            <option value="normal">P2 中</option><option value="urgent">P1 高</option><option value="deadline">P0 紧急</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">交期</label><input v-model="editForm.dueDate" type="date" class="form-input" /></div>
        <div class="form-group"><label class="form-label">状态</label>
          <select v-model="editForm.status" class="form-input form-select">
            <option value="pending">待排产</option><option value="scheduled">已排产</option>
            <option value="in_progress">生产中</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 40px; color: var(--muted); }
.mono { font-family: var(--font-mono); font-size: 13px; }
.action-btns { display: flex; gap: 4px; }
.text-danger { color: var(--danger); font-weight: 600; }
.text-warning { color: var(--warning); font-weight: 600; }
.clickable { cursor: pointer; }
.clickable:hover td { background: var(--surface-alt); }
.filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; padding: 12px 16px; }
.filter-count { font-size: 12px; color: var(--muted); margin-left: auto; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 100%; max-width: 500px; padding: 24px; }
.modal h3 { margin-bottom: 16px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
</style>
