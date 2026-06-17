import fp from 'fastify-plugin'
import { clerkPlugin, getAuth } from '@clerk/fastify'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { env } from '../config/env.js'

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(clerkPlugin, {
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  })
})

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = getAuth(request)
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}
