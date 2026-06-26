import { MaterialBatch } from '../domain/material/MaterialBatch.js';
import { MaterialRepository } from '../domain/material/MaterialRepository.js';
import { EventBus } from '../infrastructure/events/EventBus.js';
import { EventStore } from '../infrastructure/events/EventStore.js';

export class MaterialService {
  constructor(
    private materialRepo: MaterialRepository,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {}

  async inbound(params: {
    batchNo: string;
    materialSpec: string;
    supplierName?: string;
    color?: string;
    quantity: number;
    unit?: string;
    price?: number;
  }): Promise<MaterialBatch> {
    const existing = await this.materialRepo.findByBatchNo(params.batchNo);
    if (existing) {
      existing.inbound(params.quantity);
      await this.materialRepo.save(existing);
      const events = existing.pullEvents();
      this.eventStore.saveAll(events);
      await this.eventBus.publishAll(events);
      return existing;
    }

    const batch = MaterialBatch.create({
      id: crypto.randomUUID(),
      ...params,
    });
    await this.materialRepo.save(batch);
    const events = batch.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);
    return batch;
  }

  async consume(taskId: string, batchId: string, quantity: number): Promise<void> {
    const batch = await this.materialRepo.findById(batchId);
    if (!batch) throw new Error('Material batch not found');
    batch.consume(taskId, quantity);
    await this.materialRepo.save(batch);
    const events = batch.pullEvents();
    this.eventStore.saveAll(events);
    await this.eventBus.publishAll(events);
  }

  async listAll(): Promise<MaterialBatch[]> {
    return this.materialRepo.findAll();
  }

  async getLowStock(threshold?: number): Promise<MaterialBatch[]> {
    return this.materialRepo.findLowStock(threshold);
  }
}
