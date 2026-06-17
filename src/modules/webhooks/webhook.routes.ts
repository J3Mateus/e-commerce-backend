import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { verifyMPSignature, handlePaymentUpdate } from './webhook.service.js'

export default async function webhookRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/webhooks/mercadopago',
    schema: {
      tags: ['Webhooks'],
      body: z.object({
        type: z.string(),
        data: z.object({ id: z.string() }),
      }),
      response: { 200: z.object({ received: z.boolean() }) },
    },
    handler: async (request, reply) => {
      const xSignature = request.headers['x-signature'] as string | undefined
      const xRequestId = request.headers['x-request-id'] as string | undefined
      const dataId = request.body.data.id

      if (xSignature && xRequestId) {
        const valid = verifyMPSignature({ xSignature, xRequestId, dataId })
        if (!valid) {
          fastify.log.warn({ xRequestId }, 'Invalid MP webhook signature — ignoring')
          return reply.send({ received: true })
        }
      }

      if (request.body.type === 'payment') {
        // Fire-and-forget — retorna 200 imediatamente para MP não retentar
        handlePaymentUpdate(dataId).catch((err) => fastify.log.error(err, 'Webhook processing error'))
      }

      return reply.send({ received: true })
    },
  })
}
