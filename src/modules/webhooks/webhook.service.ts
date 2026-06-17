import crypto from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { db } from '../../db/index.js'
import { orders, orderItems, products } from '../../db/schema.js'
import { env } from '../../config/env.js'

const mpClient = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN })

export function verifyMPSignature(params: {
  xSignature: string
  xRequestId: string
  dataId: string
}): boolean {
  const { xSignature, xRequestId, dataId } = params
  const parts = xSignature.split(',')
  const ts = parts.find((p) => p.startsWith('ts='))?.slice(3)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const hash = crypto.createHmac('sha256', env.MERCADOPAGO_WEBHOOK_SECRET).update(manifest).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(v1, 'hex'))
  } catch {
    return false
  }
}

const MP_STATUS_MAP: Record<string, 'pending' | 'processing' | 'cancelled'> = {
  approved: 'processing',
  pending: 'pending',
  in_process: 'pending',
  rejected: 'cancelled',
  cancelled: 'cancelled',
  refunded: 'cancelled',
  charged_back: 'cancelled',
}

export async function handlePaymentUpdate(paymentId: string): Promise<void> {
  const payment = new Payment(mpClient)
  const paymentData = await payment.get({ id: paymentId })

  if (env.MERCADOPAGO_COLLECTOR_ID && String(paymentData.collector_id) !== env.MERCADOPAGO_COLLECTOR_ID) {
    return // payment belongs to a different MP account — ignore
  }

  const orderId = paymentData.external_reference
  if (!orderId) return

  const newStatus = MP_STATUS_MAP[paymentData.status ?? '']
  if (!newStatus) return // unknown status — preserve current order state

  const TERMINAL_STATUSES = ['processing', 'shipped', 'delivered']

  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update')
    if (!order) return

    if (TERMINAL_STATUSES.includes(order.status) && newStatus === 'pending') {
      return // ignore — order already past this state
    }

    await tx
      .update(orders)
      .set({ status: newStatus, mpPaymentId: String(paymentId), updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Devolve estoque se pagamento foi cancelado/rejeitado
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}`, updatedAt: new Date() })
          .where(eq(products.id, item.productId))
      }
    }
  })
}
