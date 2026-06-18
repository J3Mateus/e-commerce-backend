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
      response: { 201: z.object({ data: ProductResponseSchema }), 409: z.object({ error: z.string() }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      try {
        return reply.status(201).send({ data: await createProduct(request.body) })
      } catch (err: any) {
        if (err.code === '23505') return reply.status(409).send({ error: 'Slug already exists' })
        throw err
      }
    },
  })

  f.route({
    method: 'PATCH', url: '/admin/products/:id',
    schema: {
      tags: ['Admin'], security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }), body: UpdateProductBodySchema,
      response: { 200: z.object({ data: ProductResponseSchema }), 404: z.object({ error: z.string() }), 409: z.object({ error: z.string() }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      try {
        const data = await updateProduct(request.params.id, request.body)
        if (!data) return reply.status(404).send({ error: 'Product not found' })
        return reply.send({ data })
      } catch (err: any) {
        if (err.code === '23505') return reply.status(409).send({ error: 'Slug already exists' })
        throw err
      }
    },
  })

  f.route({
    method: 'DELETE', url: '/admin/products/:id',
    schema: {
      tags: ['Admin'], security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.void(), 404: z.object({ error: z.string() }), 409: z.object({ error: z.string() }) },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      try {
        const deleted = await deleteProduct(request.params.id)
        if (!deleted) return reply.status(404).send({ error: 'Product not found' })
        return reply.status(204).send()
      } catch (err: any) {
        if (err.code === '23503') return reply.status(409).send({ error: 'Product has associated orders' })
        throw err
      }
    },
  })
}
