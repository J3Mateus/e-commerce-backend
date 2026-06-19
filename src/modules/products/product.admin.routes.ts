import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAdmin } from '../../plugins/admin.js'
import { ProductResponseSchema } from './product.schema.js'
import { CreateProductBodySchema, UpdateProductBodySchema } from './product.admin.schema.js'
import { createProduct, updateProduct, deleteProduct } from './product.admin.service.js'

export default async function productAdminRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.route({
    method: 'POST', url: '/admin/products',
    schema: {
      tags: ['Admin'], security: [{ bearerAuth: [] }],
      body: CreateProductBodySchema,
      response: { 201: z.object({ data: ProductResponseSchema }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      return reply.status(201).send({ data: await createProduct(request.body) })
    },
  })

  f.route({
    method: 'PATCH', url: '/admin/products/:id',
    schema: {
      tags: ['Admin'], security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }), body: UpdateProductBodySchema,
      response: { 200: z.object({ data: ProductResponseSchema }), 404: z.object({ error: z.string() }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const data = await updateProduct(request.params.id, request.body)
      if (!data) return reply.status(404).send({ error: 'Product not found' })
      return reply.send({ data })
    },
  })

  f.route({
    method: 'DELETE', url: '/admin/products/:id',
    schema: {
      tags: ['Admin'], security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.void(), 404: z.object({ error: z.string() }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const deleted = await deleteProduct(request.params.id)
      if (!deleted) return reply.status(404).send({ error: 'Product not found' })
      return reply.status(204).send()
    },
  })
}
