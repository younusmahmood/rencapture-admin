/**
 * Production HTTP entry — same two jobs as rencapture-web's serve.mjs:
 * bind the built fetch handler to a port, and serve dist/client in front of
 * it (the handler renders routes but does not serve static assets itself).
 */
import { serve } from 'srvx/node'
import { serveStatic } from 'srvx/static'
import handler from './dist/server/server.js'

const port = Number(process.env.PORT ?? 47391)
const hostname = process.env.HOST ?? '0.0.0.0'

const cacheStaticAssets = async (request, next) => {
  const response = await next()
  if (response.ok && new URL(request.url).pathname.startsWith('/assets/')) {
    try {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    } catch {
      // Some runtimes hand back an immutable Response; the asset still serves.
    }
  }
  return response
}

const server = serve({
  fetch: handler.fetch,
  middleware: [cacheStaticAssets, serveStatic({ dir: './dist/client' })],
  port,
  hostname,
})

console.log(`RenCapture Admin listening on http://${hostname}:${port}`)

let shuttingDown = false
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`${signal} received — draining connections`)
    Promise.resolve(server.close?.())
      .catch((error) => console.error('Error during shutdown', error))
      .finally(() => process.exit(0))
    setTimeout(() => process.exit(0), 10_000).unref()
  })
}
