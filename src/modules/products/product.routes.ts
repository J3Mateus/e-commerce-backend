import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProductResponseSchema, ProductListQuerySchema } from './product.schema.js'
import { listProducts, getProductById } from './product.service.js'

export default async function productRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.route({
    method: 'GET',
    url: '/products',
    schema: {
      tags: ['Products'],
      querystring: ProductListQuerySchema,
      response: { 200: z.object({ data: z.array(ProductResponseSchema) }) },
    },
    handler: async (request, reply) => {
      const { categoryId } = request.query
      const data = await listProducts(categoryId)
      return reply.send({ data })
    },
  })

  f.route({
    method: 'GET',
    url: '/products/:id',
    schema: {
      tags: ['Products'],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ data: ProductResponseSchema }),
        404: z.object({ error: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const product = await getProductById(request.params.id)
      if (!product) return reply.status(404).send({ error: 'Product not found' })
      return reply.send({ data: product })
    },
  })
}
