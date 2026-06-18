import { getAuth } from '@clerk/fastify'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { env } from '../config/env.js'

const adminIds = new Set(env.ADMIN_USER_IDS.split(',').filter(Boolean))

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = getAuth(request)
  if (!userId || !adminIds.has(userId)) {
    return reply.status(403).send({ error: 'Forbidden' })
  }
}
