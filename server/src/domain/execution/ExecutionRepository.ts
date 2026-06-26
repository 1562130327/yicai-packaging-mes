import { Execution } from './Execution.js';

export interface ExecutionRepository {
  findById(id: string): Promise<Execution | null>;
  findByTaskId(taskId: string): Promise<Execution[]>;
  save(execution: Execution): Promise<void>;
}
