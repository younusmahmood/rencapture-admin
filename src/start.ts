import { createMiddleware, createStart } from '@tanstack/react-start'

/**
 * Global security headers — same reasoning as rencapture-web's src/start.ts.
 * This app's URLs (`/clinics/<id>`) identify clinics rather than patients, so
 * the stakes are lower than the console's, but the account itself can
 * provision or disable any clinic, so the headers stay just as strict.
 */

function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

const securityHeaders = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const result = await next()
    const headers = result.response.headers
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('Referrer-Policy', 'no-referrer')
    headers.set('Content-Security-Policy', contentSecurityPolicy())
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    )
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    // Every routed response is dynamic and operator-only; static assets are
    // served upstream in serve.mjs with their own cache policy.
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    headers.set('Pragma', 'no-cache')
    // Keep this tool out of every search index and crawler.
    headers.set('X-Robots-Tag', 'noindex, nofollow')
    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders],
}))
