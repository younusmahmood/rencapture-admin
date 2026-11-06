import { createFileRoute } from '@tanstack/react-router'

/** Shallow load-balancer probe — never calls Convex, requires no session. */
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        }),
    },
  },
})
