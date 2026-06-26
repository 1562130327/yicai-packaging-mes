import { MaterialBatch } from '../../domain/material/MaterialBatch.js';
import { MaterialRepository as IMaterialRepository } from '../../domain/material/MaterialRepository.js';
import { queryAll, queryOne, execute } from '../database.js';

export class MaterialRepository implements IMaterialRepository {
  async findById(id: string): Promise<MaterialBatch | null> {
    const row = queryOne(`SELECT * FROM inventory_batches WHERE id = ?`, [id]);
    return row ? MaterialBatch.fromRow(row) : null;
  }

  async findByBatchNo(batchNo: string): Promise<MaterialBatch | null> {
    const row = queryOne(`SELECT * FROM inventory_batches WHERE batch_no = ?`, [batchNo]);
    return row ? MaterialBatch.fromRow(row) : null;
  }

  async findAll(): Promise<MaterialBatch[]> {
    const rows = queryAll(`SELECT * FROM inventory_batches ORDER BY material_spec`);
    return rows.map(r => MaterialBatch.fromRow(r));
  }

  async findLowStock(threshold: number = 100): Promise<MaterialBatch[]> {
    const rows = queryAll(`SELECT * FROM inventory_batches WHERE remaining_qty < ? ORDER BY remaining_qty ASC`, [threshold]);
    return rows.map(r => MaterialBatch.fromRow(r));
  }

  async save(batch: MaterialBatch): Promise<void> {
    const existing = queryOne(`SELECT id FROM inventory_batches WHERE id = ?`, [batch.id]);
    if (existing) {
      execute(
        `UPDATE inventory_batches SET batch_no=?, material_spec=?, supplier_name=?, color=?, remaining_qty=?, unit=?, price=?, updated_at=datetime('now','localtime') WHERE id=?`,
        [batch.batchNo, batch.materialSpec, batch.supplierName, batch.color, batch.remainingQty, batch.unit, batch.price, batch.id]
      );
    } else {
      execute(
        `INSERT INTO inventory_batches (id, batch_no, material_spec, supplier_name, color, remaining_qty, unit, price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))`,
        [batch.id, batch.batchNo, batch.materialSpec, batch.supplierName, batch.color, batch.remainingQty, batch.unit, batch.price]
      );
    }
  }
}
