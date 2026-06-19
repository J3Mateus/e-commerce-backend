import { eq, sql, inArray } from 'drizzle-orm'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { db } from '../../db/index.js'
import { products, orders, orderItems } from '../../db/schema.js'
import { env } from '../../config/env.js'
import type { CreateOrderBody, OrderResponse } from './order.schema.js'
import { NotFoundError, InsufficientStockError, ServiceUnavailableError } from '../../errors.js'

const mpClient = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN })

interface CreateOrderInput extends CreateOrderBody {
  clerkUserId: string
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderId: string; checkoutUrl: string }> {
  const order = await db.transaction(async (tx) => {
    const itemsData: Array<{ id: string; name: string; price: string; quantity: number }> = []

    for (const item of input.items) {
      const [product] = await tx
        .select({ id: products.id, name: products.name, stock: products.stock, price: products.price })
        .from(products)
        .where(eq(products.id, item.productId))
        .for('update')

      if (!product) throw new NotFoundError(`Produto ${item.productId}`)
      if (product.stock < item.quantity) {
        throw new InsufficientStockError(product.name, product.stock)
      }

      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}`, updatedAt: new Date() })
        .where(eq(products.id, item.productId))

      itemsData.push({ id: product.id, name: product.name, price: product.price, quantity: item.quantity })
    }

    const total = itemsData
      .reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0)
      .toFixed(2)

    const [newOrder] = await tx
      .insert(orders)
      .values({
        clerkUserId: input.clerkUserId,
        total,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
      })
      .returning()

    await tx.insert(orderItems).values(
      itemsData.map((item) => ({
        orderId: newOrder.id,
        productId: item.id,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      })),
    )

    return { order: newOrder, itemsData }
  })

  let mpPref: Awaited<ReturnType<Preference['create']>>
  try {
    const preference = new Preference(mpClient)
    mpPref = await preference.create({
      body: {
        items: order.itemsData.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          currency_id: 'BRL',
        })),
        payer: {
          email: input.customerEmail,
        },
        external_reference: order.order.id,
        notification_url: `${env.APP_URL}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${env.FRONTEND_URL}/order-confirmation`,
          failure: `${env.FRONTEND_URL}/checkout`,
          pending: `${env.FRONTEND_URL}/orders`,
        },
        ...(env.FRONTEND_URL.startsWith('http://localhost') ? {} : { auto_return: 'approved' }),
      },
    })
  } catch (mpError) {
    // Compensate: cancel order and restore stock
    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(orders.id, order.order.id))
      for (const item of order.itemsData) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
          .where(eq(products.id, item.id))
      }
    })
    throw new ServiceUnavailableError('MercadoPago')
  }

  await db
    .update(orders)
    .set({ mpPreferenceId: mpPref.id, updatedAt: new Date() })
    .where(eq(orders.id, order.order.id))

  return {
    orderId: order.order.id,
    checkoutUrl: mpPref.sandbox_init_point ?? mpPref.init_point ?? '',
  }
}

export async function listUserOrders(clerkUserId: string): Promise<OrderResponse[]> {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.clerkUserId, clerkUserId))
    .orderBy(sql`${orders.createdAt} DESC`)

  if (userOrders.length === 0) return []

  const orderIds = userOrders.map((o) => o.id)
  const items = await db
    .select({
      orderItem: orderItems,
      product: { id: products.id, name: products.name },
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(inArray(orderItems.orderId, orderIds))

  return userOrders.map((order) => ({
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

export async function getOrder(id: string, clerkUserId: string): Promise<OrderResponse | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))

  if (!order || order.clerkUserId !== clerkUserId) return null

  const items = await db
    .select({
      orderItem: orderItems,
      product: { id: products.id, name: products.name },
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id))

  return {
    id: order.id,
    status: order.status,
    total: order.total,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map((i) => ({
      id: i.orderItem.id,
      productId: i.orderItem.productId,
      productName: i.product.name,
      quantity: i.orderItem.quantity,
      priceAtPurchase: i.orderItem.priceAtPurchase,
    })),
  }
}
