import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAdmin } from '../../plugins/admin.js'
import { CategoryResponseSchema } from './category.schema.js'
import { CreateCategoryBodySchema, UpdateCategoryBodySchema } from './category.admin.schema.js'
import { createCategory, updateCategory, deleteCategory } from './category.admin.service.js'

export default async function categoryAdminRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.route({
    method: 'POST',
    url: '/admin/categories',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      body: CreateCategoryBodySchema,
      response: {
        201: z.object({ data: CategoryResponseSchema }),
      },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      return reply.status(201).send({ data: await createCategory(request.body) })
    },
  })

  f.route({
    method: 'PATCH',
    url: '/admin/categories/:id',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: UpdateCategoryBodySchema,
      response: {
        200: z.object({ data: CategoryResponseSchema }),
        404: z.object({ error: z.string() }),
      },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const data = await updateCategory(request.params.id, request.body)
      if (!data) return reply.status(404).send({ error: 'Category not found' })
      return reply.send({ data })
    },
  })

  f.route({
    method: 'DELETE',
    url: '/admin/categories/:id',
    schema: {
      tags: ['Admin'],
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.void(),
        404: z.object({ error: z.string() }),
      },
    },
    preHandler: requireAdmin,
    handler: async (request, reply) => {
      const deleted = await deleteCategory(request.params.id)
      if (!deleted) return reply.status(404).send({ error: 'Category not found' })
      return reply.status(204).send()
    },
  })
}
