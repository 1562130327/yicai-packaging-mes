# 溢彩包装 MES — API 文档

## 基础信息

- Base URL: `http://localhost:3001/api`
- 认证: Bearer Token (JWT)
- Content-Type: application/json

## 认证

### POST /api/auth/login
```json
// Request
{ "username": "panguanglong", "password": "123456" }

// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "panguanglong",
    "name": "潘光龙",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/auth/register
```json
// Request (管理员专用)
{ "username": "newuser", "password": "123456", "name": "新员工", "role": "worker" }

// Response 201
{ "success": true, "data": { "id": "uuid", "username": "newuser", "name": "新员工", "role": "worker" } }
```

---

## 订单管理

### POST /api/orders — 创建订单
```json
// Request
{
  "productCode": "EVA-38-001",
  "customerName": "兴达",
  "priority": "urgent",
  "materialSpec": "黑色38°BC料",
  "quantity": 5000,
  "dueDate": "2026-07-01"
}

// Response 201
{ "success": true, "data": { "id": "uuid", "code": "ORD-001234" } }
```

### GET /api/orders — 订单列表
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "ORD-001234",
      "productCode": "EVA-38-001",
      "customerName": "兴达",
      "priority": "urgent",
      "status": "pending",
      "dueDate": "2026-07-01",
      "quantity": 5000
    }
  ]
}
```

### GET /api/orders/:id — 订单详情
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "ORD-001234",
    "steps": [
      { "id": "uuid", "type": "cutting", "name": "下料", "status": "waiting", "sequence": 1 },
      { "id": "uuid", "type": "slicing", "name": "裁切", "status": "waiting", "sequence": 2 }
    ]
  }
}
```

### PUT /api/orders/:id — 编辑订单
```json
// Request
{ "priority": "deadline", "dueDate": "2026-06-30" }

// Response 200
{ "success": true }
```

### DELETE /api/orders/:id — 删除订单
```json
// Response 200
{ "success": true }
```

---

## 任务管理（核心）

### POST /api/tasks — 创建任务
```json
// Request
{
  "stepId": "workflow-step-uuid",
  "orderId": "order-uuid",
  "quantity": 5000,
  "priority": 5
}

// Response 201
{ "success": true, "data": { "id": "uuid", "status": "pending" } }
```

### GET /api/tasks — 任务列表
```
GET /api/tasks?status=pending&workerId=xxx&orderId=xxx
```

### PUT /api/tasks/:id/assign — 分配任务
```json
// Request
{ "workerId": "worker-uuid", "machineId": "machine-uuid" }

// Response 200
{ "success": true }
```

### PUT /api/tasks/:id/start — 开始任务
```json
// Response 200
{ "success": true }
```

### PUT /api/tasks/:id/complete — 完成任务
```json
// Request
{ "quantity": 5000, "defectQty": 20 }

// Response 200
{ "success": true, "message": "任务完成，下一步工序已创建" }
```

### PUT /api/tasks/:id/pause — 暂停任务
```json
// Request
{ "reason": "材料不足" }

// Response 200
{ "success": true }
```

---

## 生产记录

### POST /api/executions — 记录生产
```json
// Request
{
  "taskId": "task-uuid",
  "quantity": 1000,
  "defectQty": 5,
  "notes": "正常生产"
}

// Response 201
{ "success": true }
```

---

## 异常管理

### POST /api/exceptions — 上报异常
```json
// Request
{
  "taskId": "task-uuid",
  "type": "machine_failure",
  "severity": "high",
  "description": "CNC-01 主轴异响"
}

// Response 201
{ "success": true }
```

### GET /api/exceptions — 异常列表

### PUT /api/exceptions/:id/resolve — 解决异常
```json
// Request
{ "resolution": "已更换主轴轴承" }
```

---

## 材料管理

### GET /api/materials — 材料列表

### POST /api/materials/inbound — 入库
```json
// Request
{
  "batchNo": "B2024-001",
  "materialSpec": "黑色38°BC料",
  "supplierName": "宏泰",
  "quantity": 500,
  "unit": "张"
}
```

### GET /api/materials/alerts — 库存预警

---

## 机器管理

### GET /api/machines — 机器列表

### PUT /api/machines/:id/status — 更新状态
```json
// Request
{ "status": "fault" }
```

---

## 工人管理

### GET /api/workers — 工人列表

### GET /api/workers/:id/tasks — 工人的任务

---

## 看板

### GET /api/dashboard — 看板数据
```json
// Response 200
{
  "success": true,
  "data": {
    "kpi": {
      "activeOrders": 32,
      "pendingTasks": 15,
      "runningTasks": 8,
      "completedToday": 12,
      "inventoryAlerts": 5,
      "anomalyCount": 2
    },
    "recentTasks": [...],
    "machines": [...],
    "workers": [...]
  }
}
```

---

## 事件流

### GET /api/events — 领域事件
```
GET /api/events?aggregateType=task&limit=50
```
