import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { getAuth } from '@clerk/fastify'
import { requireAuth } from '../../plugins/clerk.js'
import { CreateOrderBodySchema, OrderResponseSchema } from './order.schema.js'
import { createOrder, listUserOrders, getOrder } from './order.service.js'

export default async function orderRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.route({
    method: 'POST',
    url: '/orders',
    schema: {
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
      body: CreateOrderBodySchema,
      response: {
        201: z.object({ data: z.object({ orderId: z.string(), checkoutUrl: z.string() }) }),
      },
    },
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const { userId } = getAuth(request)
      const result = await createOrder({ ...request.body, clerkUserId: userId! })
      return reply.status(201).send({ data: result })
    },
  })

  f.route({
    method: 'GET',
    url: '/orders',
    schema: {
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
      response: { 200: z.object({ data: z.array(OrderResponseSchema) }) },
    },
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const { userId } = getAuth(request)
      const data = await listUserOrders(userId!)
      return reply.send({ data })
    },
  })

  f.route({
    method: 'GET',
    url: '/orders/:id',
    schema: {
      tags: ['Orders'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ data: OrderResponseSchema }),
        404: z.object({ error: z.string() }),
      },
    },
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const { userId } = getAuth(request)
      const order = await getOrder(request.params.id, userId!)
      if (!order) return reply.status(404).send({ error: 'Order not found' })
      return reply.send({ data: order })
    },
  })
}
