import { Exception, ExceptionType, ExceptionSeverity } from '../domain/exception/Exception.js';
import { ExceptionRepository } from '../domain/exception/ExceptionRepository.js';
import { EventBus } from '../infrastructure/events/EventBus.js';
import { EventStore } from '../infrastructure/events/EventStore.js';
import { TaskService } from './TaskService.js';

export class ExceptionService {
  constructor(
    private exceptionRepo: ExceptionRepository,
    private taskService: TaskService,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {}

  async raiseException(params: {
    taskId: string;
    type: ExceptionType;
    severity: ExceptionSeverity;
    description: string;
  }): Promise<Exception> {
    const exception = Exception.create({
      id: crypto.randomUUID(),
      ...params,
    });

    await this.exceptionRepo.save(exception);

    // 暂停关联的任务
    if (params.severity === 'high') {
      try {
        await this.taskService.pauseTask(params.taskId, `异常: ${params.description}`);
      } catch (e) {
        // 任务可能已完成，忽略
      }
    }

    const events = exception.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);

    return exception;
  }

  async resolveException(exceptionId: string, resolution: string): Promise<void> {
    const exception = await this.exceptionRepo.findById(exceptionId);
    if (!exception) throw new Error('Exception not found');
    exception.resolve(resolution);
    await this.exceptionRepo.save(exception);
    const events = exception.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);
  }

  async listAll(): Promise<Exception[]> {
    return this.exceptionRepo.findAll();
  }

  async listOpen(): Promise<Exception[]> {
    return this.exceptionRepo.findOpen();
  }
}
