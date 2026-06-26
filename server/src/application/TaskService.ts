import { Task } from '../domain/task/Task.js';
import { TaskRepository } from '../domain/task/TaskRepository.js';
import { EventBus } from '../infrastructure/events/EventBus.js';
import { EventStore } from '../infrastructure/events/EventStore.js';

/**
 * Task 应用服务
 * 编排 Task 领域逻辑，不包含业务规则
 */
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {}

  /**
   * 通用命令执行模板
   * 查找聚合根 → 执行领域命令 → 持久化 → 发布事件
   */
  private async executeCommand(taskId: string, command: (task: Task) => void): Promise<Task> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) throw new Error('Task not found');

    command(task);
    await this.taskRepo.save(task);

    const events = task.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);

    return task;
  }

  /**
   * 创建任务
   */
  async createTask(params: {
    stepId: string;
    orderId: string;
    quantity: number;
    priority?: number;
    estimatedHours?: number;
  }): Promise<Task> {
    const task = Task.create({
      id: crypto.randomUUID(),
      stepId: params.stepId,
      orderId: params.orderId,
      quantity: params.quantity,
      priority: params.priority,
      estimatedHours: params.estimatedHours,
    });

    await this.taskRepo.save(task);
    const events = task.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);

    return task;
  }

  /**
   * 分配任务
   */
  async assignTask(taskId: string, workerId: string, machineId: string): Promise<void> {
    await this.executeCommand(taskId, (task) => task.assign(workerId, machineId));
  }

  /**
   * 开始任务
   */
  async startTask(taskId: string): Promise<void> {
    await this.executeCommand(taskId, (task) => task.start());
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, quantity: number, defectQty: number = 0): Promise<void> {
    await this.executeCommand(taskId, (task) => task.complete(quantity, defectQty));
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string, reason: string): Promise<void> {
    await this.executeCommand(taskId, (task) => task.pause(reason));
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<void> {
    await this.executeCommand(taskId, (task) => task.resume());
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string, reason: string): Promise<void> {
    await this.executeCommand(taskId, (task) => task.cancel(reason));
  }

  /**
   * 获取任务
   */
  async getTask(taskId: string): Promise<Task | null> {
    return this.taskRepo.findById(taskId);
  }

  /**
   * 获取任务列表
   */
  async listTasks(filters?: { status?: string; workerId?: string; orderId?: string }): Promise<Task[]> {
    return this.taskRepo.findAll(filters as any);
  }

  /**
   * 获取工人的任务
   */
  async getWorkerTasks(workerId: string): Promise<Task[]> {
    return this.taskRepo.findByWorkerId(workerId);
  }

  /**
   * 任务统计
   */
  async getStats(): Promise<{ pending: number; assigned: number; running: number; completed: number }> {
    const [pending, assigned, running, completed] = await Promise.all([
      this.taskRepo.count({ status: 'pending' }),
      this.taskRepo.count({ status: 'assigned' }),
      this.taskRepo.count({ status: 'running' }),
      this.taskRepo.count({ status: 'completed' }),
    ]);
    return { pending, assigned, running, completed };
  }
}
