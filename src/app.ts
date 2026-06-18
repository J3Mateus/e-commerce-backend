import Fastify from 'fastify'
import cors from '@fastify/cors'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import swaggerPlugin from './plugins/swagger.js'
import clerkPlugin from './plugins/clerk.js'
import categoryRoutes from './modules/categories/category.routes.js'
import productRoutes from './modules/products/product.routes.js'
import orderRoutes from './modules/orders/order.routes.js'
import webhookRoutes from './modules/webhooks/webhook.routes.js'
import productAdminRoutes from './modules/products/product.admin.routes.js'
import { env } from './config/env.js'

export async function buildApp() {
  const fastify = Fastify({ logger: true })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

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

  return fastify
}
