import Fastify from 'fastify'
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler, hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import swaggerPlugin from './plugins/swagger.js'
import clerkPlugin from './plugins/clerk.js'
import categoryRoutes from './modules/categories/category.routes.js'
import categoryAdminRoutes from './modules/categories/category.admin.routes.js'
import productRoutes from './modules/products/product.routes.js'
import orderRoutes from './modules/orders/order.routes.js'
import orderAdminRoutes from './modules/orders/order.admin.routes.js'
import webhookRoutes from './modules/webhooks/webhook.routes.js'
import productAdminRoutes from './modules/products/product.admin.routes.js'
import { env } from './config/env.js'
import { AppError } from './errors.js'

export async function buildApp() {
  const fastify = Fastify({ logger: true })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.setErrorHandler((error, _request, reply) => {
    // Fastify/Zod validation errors (400)
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: error.validation,
      })
    }

    // Typed app errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }

    // PostgreSQL unique constraint
    if ((error as any).code === '23505') {
      return reply.status(409).send({ error: 'Registro já existe (conflito)' })
    }

    // PostgreSQL foreign key
    if ((error as any).code === '23503') {
      return reply.status(409).send({ error: 'Registro possui dependências' })
    }

    // Unknown — log and return 500
    fastify.log.error({ err: error }, 'Unhandled error')
    return reply.status(500).send({ error: 'Erro interno do servidor' })
  })

  await fastify.register(cors, {
    origin: [env.FRONTEND_URL, env.APP_URL],
  })
  await fastify.register(swaggerPlugin)
  await fastify.register(clerkPlugin)

  await fastify.register(categoryRoutes, { prefix: '/api' })
  await fastify.register(productRoutes, { prefix: '/api' })
  await fastify.register(orderRoutes, { prefix: '/api' })
  await fastify.register(webhookRoutes, { prefix: '/api' })
  await fastify.register(productAdminRoutes, { prefix: '/api' })
  await fastify.register(categoryAdminRoutes, { prefix: '/api' })
  await fastify.register(orderAdminRoutes, { prefix: '/api' })

  return fastify
}
