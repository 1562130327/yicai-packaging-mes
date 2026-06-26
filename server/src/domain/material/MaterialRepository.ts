import { MaterialBatch } from './MaterialBatch.js';

export interface MaterialRepository {
  findById(id: string): Promise<MaterialBatch | null>;
  findByBatchNo(batchNo: string): Promise<MaterialBatch | null>;
  findAll(): Promise<MaterialBatch[]>;
  findLowStock(threshold?: number): Promise<MaterialBatch[]>;
  save(batch: MaterialBatch): Promise<void>;
}
