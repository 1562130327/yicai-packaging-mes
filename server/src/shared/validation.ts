import { z } from 'zod';

/**
 * 通用校验辅助函数
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return { success: false, error: errors };
}

/**
 * Task 创建校验
 */
export const CreateTaskSchema = z.object({
  stepId: z.string().min(1, 'stepId 不能为空'),
  orderId: z.string().min(1, 'orderId 不能为空'),
  quantity: z.number().int().positive('quantity 必须为正整数'),
  priority: z.number().int().min(1).max(5).optional().default(3),
  estimatedHours: z.number().positive().optional(),
});

/**
 * Task 完成校验
 */
export const CompleteTaskSchema = z.object({
  quantity: z.number().int().nonnegative('quantity 不能为负数'),
  defectQty: z.number().int().nonnegative().optional().default(0),
});

/**
 * 材料入库校验
 */
export const InboundMaterialSchema = z.object({
  batchNo: z.string().min(1, '批次号不能为空'),
  materialSpec: z.string().min(1, '材料规格不能为空'),
  supplierName: z.string().optional().default(''),
  color: z.string().optional().default(''),
  quantity: z.number().positive('数量必须为正数'),
  unit: z.string().optional().default('张'),
  price: z.number().nonnegative().optional().default(0),
});

/**
 * 异常上报校验
 */
export const RaiseExceptionSchema = z.object({
  taskId: z.string().min(1, 'taskId 不能为空'),
  type: z.enum(['material_quality', 'machine_failure', 'staff_shortage', 'process_issue', 'other']),
  severity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  description: z.string().min(1, '描述不能为空').max(500, '描述不能超过500字'),
});

/**
 * 订单创建校验
 */
export const CreateOrderSchema = z.object({
  productCode: z.string().min(1, '产品编号不能为空'),
  customerName: z.string().min(1, '客户名称不能为空'),
  category: z.string().optional().default(''),
  processType: z.string().optional().default(''),
  priority: z.enum(['deadline', 'urgent', 'normal', 'attention', 'unmentioned']).optional().default('normal'),
  materialSpec: z.string().optional().default(''),
  sheetSize: z.string().optional().default(''),
  quantity: z.number().int().nonnegative().optional().default(0),
  dueDate: z.string().optional().default(''),
});
