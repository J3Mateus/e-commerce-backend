import { z } from 'zod'

export const OrderStatusSchema = z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
export const UpdateOrderStatusBodySchema = z.object({ status: OrderStatusSchema })
export const AdminOrderQuerySchema = z.object({ status: OrderStatusSchema.optional() })

export type UpdateOrderStatusBody = z.infer<typeof UpdateOrderStatusBodySchema>
