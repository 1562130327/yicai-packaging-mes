import { Task, TaskStatus } from './Task.js';

/**
 * Task 仓储接口
 * 定义持久化操作，具体实现由 infrastructure 层提供
 */
export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByOrderId(orderId: string): Promise<Task[]>;
  findByWorkerId(workerId: string): Promise<Task[]>;
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findAll(filters?: { status?: TaskStatus; workerId?: string; orderId?: string }): Promise<Task[]>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  count(filters?: { status?: TaskStatus }): Promise<number>;
}
