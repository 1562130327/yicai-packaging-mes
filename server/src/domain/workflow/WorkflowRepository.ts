import { Workflow } from './Workflow.js';

export interface WorkflowRepository {
  findById(id: string): Promise<Workflow | null>;
  findByOrderId(orderId: string): Promise<Workflow | null>;
  save(workflow: Workflow): Promise<void>;
}
