import { AggregateRoot } from '../shared/AggregateRoot.js';
import { DomainEvent } from '../shared/DomainEvent.js';

/**
 * MaterialBatch 领域事件
 */
export class MaterialConsumed extends DomainEvent {
  constructor(batchId: string, taskId: string, quantity: number, remainingQty: number) {
    super({
      eventType: 'material.consumed',
      aggregateType: 'material_batch',
      aggregateId: batchId,
      payload: { taskId, quantity, remainingQty },
    });
  }
}

export class MaterialInbound extends DomainEvent {
  constructor(batchId: string, batchNo: string, quantity: number) {
    super({
      eventType: 'material.inbound',
      aggregateType: 'material_batch',
      aggregateId: batchId,
      payload: { batchNo, quantity },
    });
  }
}

export class MaterialStockLow extends DomainEvent {
  constructor(batchId: string, batchNo: string, remainingQty: number, unit: string) {
    super({
      eventType: 'material.stock_low',
      aggregateType: 'material_batch',
      aggregateId: batchId,
      payload: { batchNo, remainingQty, unit },
    });
  }
}

/**
 * MaterialBatch 聚合根
 * 材料批次：管理库存和消耗
 */
export class MaterialBatch extends AggregateRoot {
  private _batchNo: string;
  private _materialSpec: string;
  private _supplierName: string;
  private _color: string;
  private _remainingQty: number;
  private _unit: string;
  private _price: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(params: {
    id: string;
    batchNo: string;
    materialSpec: string;
    supplierName: string;
    color: string;
    remainingQty: number;
    unit: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._batchNo = params.batchNo;
    this._materialSpec = params.materialSpec;
    this._supplierName = params.supplierName;
    this._color = params.color;
    this._remainingQty = params.remainingQty;
    this._unit = params.unit;
    this._price = params.price;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ========== Getters ==========
  get batchNo(): string { return this._batchNo; }
  get materialSpec(): string { return this._materialSpec; }
  get supplierName(): string { return this._supplierName; }
  get color(): string { return this._color; }
  get remainingQty(): number { return this._remainingQty; }
  get unit(): string { return this._unit; }
  get price(): number { return this._price; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * 检查库存是否充足
   */
  hasStock(quantity: number): boolean {
    return this._remainingQty >= quantity;
  }

  /**
   * 检查库存是否低于预警线
   */
  isLowStock(threshold: number = 100): boolean {
    return this._remainingQty < threshold;
  }

  // ========== 业务操作 ==========

  /**
   * 扣减库存
   */
  consume(taskId: string, quantity: number): void {
    if (quantity <= 0) throw new Error('Consumption quantity must be positive');
    if (!this.hasStock(quantity)) {
      throw new Error(`Insufficient stock: need ${quantity} ${this._unit}, have ${this._remainingQty}`);
    }

    this._remainingQty -= quantity;
    this._updatedAt = new Date();
    this.addEvent(new MaterialConsumed(this.id, taskId, quantity, this._remainingQty));

    // 检查是否触发预警
    if (this.isLowStock()) {
      this.addEvent(new MaterialStockLow(this.id, this._batchNo, this._remainingQty, this._unit));
    }
  }

  /**
   * 入库
   */
  inbound(quantity: number): void {
    if (quantity <= 0) throw new Error('Inbound quantity must be positive');
    this._remainingQty += quantity;
    this._updatedAt = new Date();
    this.addEvent(new MaterialInbound(this.id, this._batchNo, quantity));
  }

  // ========== 工厂方法 ==========

  static create(params: {
    id: string;
    batchNo: string;
    materialSpec: string;
    supplierName?: string;
    color?: string;
    quantity: number;
    unit?: string;
    price?: number;
  }): MaterialBatch {
    return new MaterialBatch({
      id: params.id,
      batchNo: params.batchNo,
      materialSpec: params.materialSpec,
      supplierName: params.supplierName ?? '',
      color: params.color ?? '',
      remainingQty: params.quantity,
      unit: params.unit ?? '张',
      price: params.price ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromRow(row: any): MaterialBatch {
    return new MaterialBatch({
      id: row.id,
      batchNo: row.batch_no,
      materialSpec: row.material_spec,
      supplierName: row.supplier_name,
      color: row.color || '',
      remainingQty: row.remaining_qty,
      unit: row.unit,
      price: row.price || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
