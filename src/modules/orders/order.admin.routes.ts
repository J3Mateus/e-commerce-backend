import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { getAuth } from '@clerk/fastify'
import { requireAdmin, adminIds } from '../../plugins/admin.js'
import { requireAuth } from '../../plugins/clerk.js'
import { OrderResponseSchema } from './order.schema.js'
import { AdminOrderQuerySchema, UpdateOrderStatusBodySchema } from './order.admin.schema.js'
import { listAllOrders, getAdminOrder, updateOrderStatus, getAdminStats } from './order.admin.service.js'

export default async function orderAdminRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.route({
    method: 'GET',
    url: '/admin/status',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      response: { 200: z.object({ isAdmin: z.boolean() }), 401: z.object({ error: z.string() }) },
    },
    preHandler: requireAuth,
    handler: async (request, reply) => {
      const { userId } = getAuth(request)
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' })
      return reply.send({ isAdmin: adminIds.has(userId) })
    },
  })

  f.route({
    method: 'GET',
    url: '/admin/stats',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          data: z.object({
            totalOrders: z.number(),
            totalRevenue: z.string(),
            totalProducts: z.number(),
            lowStockCount: z.number(),
          }),
        }),
      },
    },
    preHandler: requireAdmin,
    handler: async (_req, reply) => reply.send({ data: await getAdminStats() }),
  })

  f.route({
    method: 'GET',
    url: '/admin/orders',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      querystring: AdminOrderQuerySchema,
      response: { 200: z.object({ data: z.array(OrderResponseSchema) }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => reply.send({ data: await listAllOrders(request.query.status) }),
  })

  f.route({
    method: 'GET',
    url: '/admin/orders/:id',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ data: OrderResponseSchema }),
        404: z.object({ error: z.string() }),
      },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const order = await getAdminOrder(request.params.id)
      if (!order) return reply.status(404).send({ error: 'Order not found' })
      return reply.send({ data: order })
    },
  })

  f.route({
    method: 'PATCH',
    url: '/admin/orders/:id/status',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: UpdateOrderStatusBodySchema,
      response: {
        200: z.object({ data: OrderResponseSchema }),
        404: z.object({ error: z.string() }),
      },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const order = await updateOrderStatus(request.params.id, request.body)
      if (!order) return reply.status(404).send({ error: 'Order not found' })
      return reply.send({ data: order })
    },
  })
}
