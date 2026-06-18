import { eq, inArray, ne, sql, count, sum } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { orders, orderItems, products } from '../../db/schema.js'
import type { OrderResponse } from './order.schema.js'
import type { UpdateOrderStatusBody } from './order.admin.schema.js'
import type { z } from 'zod'
import { OrderStatusSchema } from './order.admin.schema.js'

type OrderStatusValue = z.infer<typeof OrderStatusSchema>

async function attachItems(orderList: (typeof orders.$inferSelect)[]): Promise<OrderResponse[]> {
  if (orderList.length === 0) return []
  const ids = orderList.map((o) => o.id)
  const items = await db
    .select({ orderItem: orderItems, product: { id: products.id, name: products.name } })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(inArray(orderItems.orderId, ids))

  return orderList.map((order) => ({
    id: order.id,
    status: order.status,
    total: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items
      .filter((i) => i.orderItem.orderId === order.id)
      .map((i) => ({
        id: i.orderItem.id,
        productId: i.orderItem.productId,
        productName: i.product.name,
        quantity: i.orderItem.quantity,
        priceAtPurchase: i.orderItem.priceAtPurchase,
      })),
  }))
}

export async function listAllOrders(status?: OrderStatusValue): Promise<OrderResponse[]> {
  const result = status
    ? await db.select().from(orders).where(eq(orders.status, status)).orderBy(sql`${orders.createdAt} DESC`)
    : await db.select().from(orders).orderBy(sql`${orders.createdAt} DESC`)
  return attachItems(result)
}

export async function getAdminOrder(id: string): Promise<OrderResponse | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) return null
  const [result] = await attachItems([order])
  return result
}

export async function updateOrderStatus(id: string, data: UpdateOrderStatusBody): Promise<OrderResponse | null> {
  const [order] = await db
    .update(orders)
    .set({ status: data.status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning()
  if (!order) return null
  const [result] = await attachItems([order])
  return result
}

export async function getAdminStats() {
  const [orderStats] = await db
    .select({ total: count(), revenue: sum(orders.total) })
    .from(orders)
    .where(ne(orders.status, 'cancelled'))

  const [productStats] = await db
    .select({
      total: count(),
      lowStock: sql<number>`count(*) filter (where ${products.stock} <= 5)`,
    })
    .from(products)

  return {
    totalOrders: Number(orderStats?.total ?? 0),
    totalRevenue: Number(orderStats?.revenue ?? 0).toFixed(2),
    totalProducts: Number(productStats?.total ?? 0),
    lowStockCount: Number(productStats?.lowStock ?? 0),
  }
}
