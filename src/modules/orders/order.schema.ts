import { z } from 'zod'

export const OrderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export const CreateOrderBodySchema = z.object({
  items: z.array(OrderItemInputSchema).min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
})

export const OrderItemResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  quantity: z.number().int(),
  priceAtPurchase: z.string(),
})

export const OrderResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  total: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  items: z.array(OrderItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CreateOrderBody = z.infer<typeof CreateOrderBodySchema>
export type OrderResponse = z.infer<typeof OrderResponseSchema>
