import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { CategoryResponseSchema } from './category.schema.js'
import { listCategories } from './category.service.js'

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/categories',
    schema: {
      tags: ['Categories'],
      response: {
        200: z.object({ data: z.array(CategoryResponseSchema) }),
      },
    },
    handler: async (_request, reply) => {
      const data = await listCategories()
      return reply.send({ data })
    },
  })
}
