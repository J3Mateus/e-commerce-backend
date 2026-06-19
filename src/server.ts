import { buildApp } from './app.js'
import { env } from './config/env.js'

const app = await buildApp()

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })

  if (env.NODE_ENV === 'development') {
    const ngrok = await import('@ngrok/ngrok')
    const listener = await ngrok.connect({
      addr: env.PORT,
      authtoken: env.NGROK_AUTHTOKEN,
      domain: env.NGROK_DOMAIN,
    })
    app.log.info(`ngrok tunnel: ${listener.url()}`)
  }
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
