# 溢彩包装 MES — 架构设计文档

> **OpenMES Development Constitution**
> - 第一条：业务模型永远高于页面
> - 第二条：Task 是整个系统唯一核心
> - 第三条：所有流程必须事件驱动
> - 第四条：数据库围绕领域设计
> - 第五条：模块之间不得直接依赖
> - 第六条：任何新功能必须回答"它是否提升了生产流转？"

---

## 一、项目定位

这不是 ERP，不是后台管理系统。

这是一个以 **Task（任务）为核心、Workflow（流程）驱动、Event（事件）流转** 的生产执行系统（MES）。

**所有开发围绕"生产任务流转"展开。**

---

## 二、领域模型

### 核心实体关系

```
Customer ──places──→ Order ──generates──→ Workflow ──contains──→ WorkflowStep
                                                              │
                                                         creates
                                                              ↓
Worker ←──assigned── Task ──linked-to──→ WorkflowStep
Machine ←──uses── Task
                                         │
                                    produces
                                         ↓
                                    Execution ──consumes──→ MaterialBatch
                                         │
                                    may-raise
                                         ↓
                                    Exception
```

### 领域术语表

| 术语 | 定义 | 对应现实 |
|------|------|----------|
| **Order** | 客户订单，生产入口 | 客户打电话下单 |
| **Workflow** | 订单的工艺路线 | 24种工艺模板展开为具体流程 |
| **WorkflowStep** | 工艺路线中的一个工序 | 下料、裁切、焊接、压合、检验、入库 |
| **Task** | 分配给具体人+机器的执行单元 | 师傅领到的活儿 |
| **Execution** | Task 的实际生产记录 | 师傅做完了，记录做了多少、废了多少 |
| **MaterialBatch** | 材料批次（库存单位） | 一卷黑色38°BC料 |
| **MaterialConsumption** | 执行过程中消耗的材料 | 这个活用了多少料 |
| **Exception** | 生产异常 | 机器坏了、料有问题、人不够 |
| **DomainEvent** | 领域事件 | TaskCompleted、StockLow、MachineFault |

### 核心聚合根

| 聚合根 | 包含实体 | 职责 |
|--------|----------|------|
| **Order** | OrderItem | 接收客户订单，触发 Workflow 创建 |
| **Workflow** | WorkflowStep, WorkflowEdge | 定义工艺路线，管理步骤流转 |
| **Task** | TaskAssignment, TaskEvent | 执行单元，生命周期管理 |
| **Execution** | ExecutionRecord | 生产记录，产量/废品/工时 |
| **MaterialBatch** | MaterialConsumption | 库存管理，消耗追踪 |
| **Exception** | - | 异常上报与处理 |

---

## 三、事件驱动设计

### 事件流转图

```
OrderCreated
    ↓
WorkflowCreated (从模板展开)
    ↓
TaskCreated × N (每个 WorkflowStep 生成一个 Task)
    ↓
TaskAssigned (分配给 Worker + Machine)
    ↓
TaskStarted (Worker 开始执行)
    ├→ MachineStatusChanged (机器状态: idle → running)
    └→ MaterialConsumed (扣减库存)
    ↓
TaskCompleted
    ├→ ExecutionRecorded (记录产量/废品)
    ├→ WorkflowStepCompleted (推进工序流)
    ├→ NextTaskCreated (如果有下一步)
    ├→ MachineStatusChanged (机器状态: running → idle)
    ├→ NotifyWorker (通知下一个师傅)
    └→ NotifyAdmin (通知管理员)

ExceptionRaised (任何时候都可能触发)
    ├→ TaskPaused (暂停当前任务)
    ├→ MachineStatusChanged (如果是机器故障)
    └→ NotifyAdmin (紧急通知)

MaterialStockLow (库存检查触发)
    └→ NotifyAdmin (采购预警)
```

### 事件清单

| 事件 | 触发者 | 消费者 | 作用 |
|------|--------|--------|------|
| `order.created` | OrderService | WorkflowService | 创建 Workflow |
| `workflow.created` | WorkflowService | TaskService | 批量创建 Task |
| `task.created` | TaskService | WorkerService | 通知可分配 |
| `task.assigned` | TaskService | MachineService | 锁定机器 |
| `task.started` | TaskService | ExecutionService, MaterialService | 开始记录 |
| `task.completed` | TaskService | WorkflowService, MaterialService | 推进流程 |
| `task.paused` | TaskService | WorkflowService | 暂停流程 |
| `exception.raised` | ExceptionService | TaskService | 暂停任务 |
| `material.stock_low` | MaterialService | NotificationService | 采购预警 |

---

## 四、模块边界

### 目录结构

```
server/src/
├── domain/                    # 领域层（纯业务，无外部依赖）
│   ├── order/
│   │   ├── Order.ts           # 聚合根
│   │   ├── OrderItem.ts
│   │   ├── OrderEvents.ts     # 领域事件定义
│   │   └── OrderRepository.ts # 仓储接口
│   ├── workflow/
│   │   ├── Workflow.ts
│   │   ├── WorkflowStep.ts
│   │   ├── WorkflowEdge.ts
│   │   ├── WorkflowEvents.ts
│   │   └── WorkflowRepository.ts
│   ├── task/
│   │   ├── Task.ts
│   │   ├── TaskAssignment.ts
│   │   ├── TaskEvents.ts
│   │   └── TaskRepository.ts
│   ├── execution/
│   │   ├── Execution.ts
│   │   ├── ExecutionEvents.ts
│   │   └── ExecutionRepository.ts
│   ├── material/
│   │   ├── MaterialBatch.ts
│   │   ├── MaterialConsumption.ts
│   │   ├── MaterialEvents.ts
│   │   └── MaterialRepository.ts
│   ├── machine/
│   │   ├── Machine.ts
│   │   ├── MachineEvents.ts
│   │   └── MachineRepository.ts
│   ├── worker/
│   │   ├── Worker.ts
│   │   ├── WorkerEvents.ts
│   │   └── WorkerRepository.ts
│   ├── exception/
│   │   ├── Exception.ts
│   │   ├── ExceptionEvents.ts
│   │   └── ExceptionRepository.ts
│   └── shared/
│       ├── AggregateRoot.ts   # 聚合根基类
│       ├── DomainEvent.ts     # 事件基类
│       ├── Entity.ts          # 实体基类
│       └── ValueObject.ts     # 值对象基类
│
├── application/               # 应用层（编排领域服务）
│   ├── OrderService.ts
│   ├── WorkflowService.ts
│   ├── TaskService.ts
│   ├── ExecutionService.ts
│   ├── MaterialService.ts
│   ├── MachineService.ts
│   ├── WorkerService.ts
│   ├── ExceptionService.ts
│   └── AuthService.ts
│
├── modules/                   # 模块层（事件处理器）
│   ├── order/
│   │   └── OrderModule.ts     # 注册事件处理器
│   ├── workflow/
│   │   └── WorkflowModule.ts
│   ├── task/
│   │   └── TaskModule.ts
│   ├── execution/
│   │   └── ExecutionModule.ts
│   ├── material/
│   │   └── MaterialModule.ts
│   └── notification/
│       └── NotificationModule.ts
│
├── infrastructure/            # 基础设施层
│   ├── database/
│   │   ├── Connection.ts      # 数据库连接
│   │   ├── migrations/        # 数据库迁移
│   │   └── repositories/      # 仓储实现
│   │       ├── OrderRepository.ts
│   │       ├── TaskRepository.ts
│   │       └── ...
│   ├── events/
│   │   ├── EventBus.ts        # 事件总线
│   │   └── EventStore.ts      # 事件存储
│   └── auth/
│       └── JWTProvider.ts
│
├── interfaces/                # 接口层（HTTP/CLI）
│   ├── http/
│   │   ├── routes/
│   │   │   ├── order.routes.ts
│   │   │   ├── task.routes.ts
│   │   │   └── ...
│   │   └── middleware/
│   │       └── auth.ts
│   └── cli/
│       └── commands/
│
└── shared/                    # 共享层
    ├── types.ts
    ├── constants.ts
    └── utils.ts
```

### 依赖规则

```
interfaces/ → application/ → domain/
                   ↓
              modules/ → domain/
                   ↓
           infrastructure/ → domain/

禁止：
- domain/ → 任何其他层
- application/ → interfaces/
- modules/ → interfaces/
- 任何层 → 另一模块的 application/
```

---

## 五、数据库设计

### ER 图（文本表示）

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  customers  │     │    orders     │     │ process_templates│
│─────────────│     │──────────────│     │─────────────────│
│ id (PK)     │◄────│ customer_id  │     │ id (PK)         │
│ name        │     │ id (PK)      │────►│ name            │
│ contact     │     │ code         │     │ steps (JSON)    │
│ phone       │     │ priority     │     └─────────────────┘
│ level       │     │ status       │
└─────────────┘     │ due_date     │
                    └──────┬───────┘
                           │ 1:N
                           ▼
                    ┌──────────────────┐
                    │    workflows     │
                    │──────────────────│
                    │ id (PK)          │
                    │ order_id (FK)    │
                    │ template_id (FK) │
                    │ status           │
                    └────────┬─────────┘
                             │ 1:N
                             ▼
                    ┌──────────────────┐
                    │ workflow_steps   │
                    │──────────────────│
                    │ id (PK)          │
                    │ workflow_id (FK) │
                    │ type             │
                    │ name             │
                    │ sequence         │
                    │ status           │
                    │ required_qty     │
                    │ completed_qty    │
                    └────────┬─────────┘
                             │ 1:N
                             ▼
                    ┌──────────────────┐
                    │     tasks        │
                    │──────────────────│
                    │ id (PK)          │
                    │ step_id (FK)     │
                    │ order_id (FK)    │
                    │ worker_id (FK)   │
                    │ machine_id (FK)  │
                    │ status           │
                    │ priority         │
                    │ quantity         │
                    │ started_at       │
                    │ completed_at     │
                    └────────┬─────────┘
                             │ 1:N
                             ▼
                    ┌──────────────────┐
                    │   executions     │
                    │──────────────────│
                    │ id (PK)          │
                    │ task_id (FK)     │
                    │ worker_id (FK)   │
                    │ machine_id (FK)  │
                    │ quantity         │
                    │ defect_qty       │
                    │ notes            │
                    │ recorded_at      │
                    └──────────────────┘

独立表：
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    machines      │  │    workers       │  │material_batches  │
│──────────────────│  │──────────────────│  │──────────────────│
│ id (PK)          │  │ id (PK)          │  │ id (PK)          │
│ code             │  │ name             │  │ batch_no         │
│ name             │  │ role             │  │ material_spec    │
│ type             │  │ skills (JSON)    │  │ remaining_qty    │
│ status           │  │ status           │  │ unit             │
│ process_types    │  │ phone            │  │ supplier_name    │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ domain_events    │  │   exceptions     │
│──────────────────│  │──────────────────│
│ id (PK)          │  │ id (PK)          │
│ aggregate_type   │  │ task_id (FK)     │
│ aggregate_id     │  │ type             │
│ event_type       │  │ severity         │
│ payload (JSON)   │  │ description      │
│ created_at       │  │ status           │
└──────────────────┘  └──────────────────┘
```

### 关键表设计

#### tasks（核心表）

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  step_id TEXT NOT NULL,           -- 关联 workflow_steps
  order_id TEXT NOT NULL,          -- 关联 orders
  worker_id TEXT,                  -- 关联 workers（分配后填入）
  machine_id TEXT,                 -- 关联 machines（分配后填入）
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/assigned/running/paused/completed/cancelled
  priority INTEGER NOT NULL DEFAULT 3,     -- 1-5，5最高
  quantity INTEGER NOT NULL DEFAULT 0,     -- 需要生产的数量
  completed_qty INTEGER DEFAULT 0,         -- 已完成数量
  estimated_hours REAL,                    -- 预估工时
  actual_hours REAL,                       -- 实际工时
  scheduled_at TEXT,                       -- 计划开始时间
  started_at TEXT,                         -- 实际开始时间
  completed_at TEXT,                       -- 实际完成时间
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (step_id) REFERENCES workflow_steps(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (worker_id) REFERENCES workers(id),
  FOREIGN KEY (machine_id) REFERENCES machines(id)
);
```

#### domain_events（事件存储）

```sql
CREATE TABLE domain_events (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL,    -- order/workflow/task/execution/material
  aggregate_id TEXT NOT NULL,      -- 聚合根ID
  event_type TEXT NOT NULL,        -- order.created/task.completed/...
  payload TEXT NOT NULL,           -- JSON 事件数据
  created_at TEXT NOT NULL
);
```

---

## 六、API 设计

### RESTful 路由

```
POST   /api/orders                    创建订单
GET    /api/orders                    订单列表
GET    /api/orders/:id                订单详情
PUT    /api/orders/:id                编辑订单
DELETE /api/orders/:id                删除订单

POST   /api/tasks                     创建任务
GET    /api/tasks                     任务列表（支持筛选）
GET    /api/tasks/:id                 任务详情
PUT    /api/tasks/:id/assign          分配任务
PUT    /api/tasks/:id/start           开始任务
PUT    /api/tasks/:id/complete        完成任务
PUT    /api/tasks/:id/pause           暂停任务

POST   /api/executions                记录生产
GET    /api/executions                生产记录列表

POST   /api/exceptions                上报异常
GET    /api/exceptions                异常列表
PUT    /api/exceptions/:id/resolve    解决异常

GET    /api/workflows/:orderId        获取订单的工艺路线

GET    /api/materials                 材料列表
POST   /api/materials/inbound         入库
GET    /api/materials/alerts          库存预警

GET    /api/machines                  机器列表
PUT    /api/machines/:id/status       更新机器状态

GET    /api/workers                   工人列表
GET    /api/workers/:id/tasks         工人的任务

POST   /api/auth/login                登录
POST   /api/auth/register             注册（管理员专用）

GET    /api/dashboard                 看板数据
GET    /api/events                    事件流（调试用）
```

### API 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 七、开发路线图

### 第一阶段：领域建模（无编码）

- [x] ① 重构项目目录结构
- [x] ② 重构数据库模型（ER图）
- [x] ③ 输出 API 文档
- [x] ④ 输出领域模型
- [x] ⑤ 输出模块边界
- [x] ⑥ 输出开发路线图

### 第二阶段：核心引擎（Task + Workflow）

优先级：Task 生命周期 > Workflow 引擎 > Execution 记录

- [ ] ① 定义领域基类（AggregateRoot, Entity, DomainEvent）
- [ ] ② 实现 Task 聚合根（状态机：pending → assigned → running → completed）
- [ ] ③ 实现 Workflow 聚合根（从模板展开 WorkflowStep）
- [ ] ④ 实现事件总线（EventBus）
- [ ] ⑤ 实现 TaskService（创建/分配/开始/完成）
- [ ] ⑥ 实现 WorkflowService（创建/推进步骤）
- [ ] ⑦ 实现 Task 路由（CRUD + 状态流转）
- [ ] ⑧ 实现事件存储（domain_events 表）

### 第三阶段：生产执行

- [ ] ① 实现 Execution 聚合根
- [ ] ② 实现 ExecutionService（记录生产）
- [ ] ③ 实现 MaterialService（库存扣减 + 预警）
- [ ] ④ 实现 MachineService（状态联动）
- [ ] ⑤ 实现 ExceptionService（异常上报 + 暂停任务）
- [ ] ⑥ 事件处理器：TaskCompleted → MaterialConsumed
- [ ] ⑦ 事件处理器：TaskCompleted → NextTaskCreated

### 第四阶段：接口层

- [ ] ① 实现所有 REST 路由
- [ ] ② 实现认证中间件（JWT）
- [ ] ③ 实现角色权限中间件
- [ ] ④ 实现前端核心页面（任务列表、任务详情）

### 第五阶段：运维

- [ ] ① 数据库迁移机制
- [ ] ② 日志系统
- [ ] ③ 健康检查
- [ ] ④ 部署脚本

---

## 八、代码规范

### 领域层规范

```typescript
// 聚合根基类
abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}

// Task 聚合根示例
class Task extends AggregateRoot {
  assign(workerId: string, machineId: string): void {
    if (this.status !== 'pending') throw new Error('Task not in pending state');
    this.workerId = workerId;
    this.machineId = machineId;
    this.status = 'assigned';
    this.addEvent(new TaskAssigned(this.id, workerId, machineId));
  }

  start(): void {
    if (this.status !== 'assigned') throw new Error('Task not assigned');
    this.status = 'running';
    this.startedAt = new Date();
    this.addEvent(new TaskStarted(this.id));
  }

  complete(quantity: number, defectQty: number): void {
    if (this.status !== 'running') throw new Error('Task not running');
    this.completedQty = quantity;
    this.status = 'completed';
    this.completedAt = new Date();
    this.addEvent(new TaskCompleted(this.id, quantity, defectQty));
  }
}
```

### 应用层规范

```typescript
// 应用服务只做编排，不包含业务逻辑
class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus
  ) {}

  async completeTask(taskId: string, quantity: number, defectQty: number): Promise<void> {
    // 1. 加载聚合根
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Task not found');

    // 2. 执行业务操作（领域逻辑在聚合根内）
    task.complete(quantity, defectQty);

    // 3. 持久化
    await this.taskRepo.save(task);

    // 4. 发布事件（由模块层处理后续逻辑）
    const events = task.pullEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
}
```

### 事件处理规范

```typescript
// 模块层注册事件处理器
class TaskModule {
  register(eventBus: EventBus): void {
    // TaskCompleted → 生成下一步 Task
    eventBus.on('task.completed', async (event: TaskCompleted) => {
      const workflow = await this.workflowRepo.findByTaskId(event.taskId);
      const nextStep = workflow.findNextStep(event.stepId);
      if (nextStep) {
        await this.taskService.createTask(nextStep, event.orderId);
      }
    });

    // TaskCompleted → 扣减库存
    eventBus.on('task.completed', async (event: TaskCompleted) => {
      await this.materialService.consume(event.taskId, event.quantity);
    });
  }
}
```

---

## 九、与现有代码的差异

| 现状 | 目标 | 差异 |
|------|------|------|
| 13个路由文件，业务逻辑混在路由里 | domain/ + application/ + modules/ 三层分离 | 需要完全重构 |
| 任务表存在但几乎没用 | Task 是系统唯一核心 | 需要重写 Task 生命周期 |
| 没有事件系统 | 统一事件驱动 | 需要实现 EventBus |
| 数据库表关系松散 | 严格的外键约束 | 需要重建表结构 |
| 前端直接调 API | 前端通过 Service 调用 | 前端暂不动，先重构后端 |
| 没有迁移机制 | 版本化迁移 | 需要实现 |

---

## 十、关键决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 数据库 | better-sqlite3 | 轻量、零配置、单文件部署 |
| 事件总线 | 内存 EventBus | 先跑通，后续可换消息队列 |
| 认证 | JWT + bcrypt | 无状态、安全 |
| ORM | 无（原生 SQL） | SQLite 场景下 ORM 是过度抽象 |
| 前端框架 | Vue 3 + Pinia | 已确定，不改 |
| 状态管理 | Pinia | 已确定，不改 |

---

**架构师签字：_______________**

**日期：2026-06-26**
