import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
  MERCADOPAGO_COLLECTOR_ID: z.string().optional(),
  APP_URL: z.string().url().default('http://localhost:3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NGROK_AUTHTOKEN: z.string().optional(),
  NGROK_DOMAIN: z.string().optional(),
  ADMIN_USER_IDS: z.string().default(''),
})

const rawEnv = envSchema.parse(process.env)

export const env = {
  ...rawEnv,
  APP_URL: rawEnv.NGROK_DOMAIN
    ? `https://${rawEnv.NGROK_DOMAIN}`
    : rawEnv.APP_URL,
}
