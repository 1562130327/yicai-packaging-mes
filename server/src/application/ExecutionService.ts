import { Execution } from '../domain/execution/Execution.js';
import { ExecutionRepository } from '../domain/execution/ExecutionRepository.js';
import { EventBus } from '../infrastructure/events/EventBus.js';
import { EventStore } from '../infrastructure/events/EventStore.js';

export class ExecutionService {
  constructor(
    private executionRepo: ExecutionRepository,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {}

  async recordExecution(params: {
    taskId: string;
    workerId: string;
    machineId?: string;
    quantity: number;
    defectQty?: number;
    notes?: string;
  }): Promise<Execution> {
    const execution = Execution.create({
      id: crypto.randomUUID(),
      ...params,
    });

    await this.executionRepo.save(execution);
    const events = execution.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);

    return execution;
  }

  async getExecutionsByTask(taskId: string): Promise<Execution[]> {
    return this.executionRepo.findByTaskId(taskId);
  }
}
