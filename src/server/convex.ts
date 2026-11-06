import { ConvexHttpClient } from 'convex/browser'

/**
 * Server-only Convex client — same reasoning as rencapture-web: the browser
 * never holds a Convex session token, so an XSS bug here can't exfiltrate a
 * credential that can provision or disable a clinic.
 */

let client: ConvexHttpClient | null = null

export function convexUrl(): string {
  const url = process.env.CONVEX_URL
  if (!url) {
    throw new Error(
      'CONVEX_URL is not set. Point it at the same deployment the mobile app ' +
        'and console use, e.g. https://clever-grouse-629.convex.cloud',
    )
  }
  return url
}

export function convex(): ConvexHttpClient {
  if (!client) client = new ConvexHttpClient(convexUrl())
  return client
}

/**
 * Convex surfaces application errors as `Error: ... CODE ...`. Reduce to the
 * bare code so callers can branch without regex soup.
 */
export function convexErrorCode(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  const match = msg.match(
    /\b(UNAUTHENTICATED|SESSION_EXPIRED|NOT_AUTHORIZED|NOT_FOUND|EMAIL_IN_USE|CODE_EXPIRED|CODE_INVALID|TOO_MANY_ATTEMPTS|RATE_LIMITED|INVALID_EMAIL|EMAIL_SEND_FAILED)\b/,
  )
  return match?.[1] ?? 'UNKNOWN'
}

export const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHORIZED: "That email isn't authorized for the admin app.",
  NOT_FOUND: "That clinic doesn't exist.",
  EMAIL_IN_USE: 'That email already has a RenCapture account.',
  CODE_EXPIRED: 'That code expired. Request a new one.',
  CODE_INVALID: "That code doesn't match. Check it and try again.",
  TOO_MANY_ATTEMPTS: 'Too many attempts. Request a new code.',
  RATE_LIMITED: 'Too many code requests. Wait ten minutes and try again.',
  INVALID_EMAIL: 'That email address looks wrong.',
  EMAIL_SEND_FAILED: "The email couldn't be sent. Try again in a moment.",
  UNKNOWN: 'Something went wrong. Try again.',
}

export function friendlyError(e: unknown): string {
  return ERROR_MESSAGES[convexErrorCode(e)] ?? ERROR_MESSAGES.UNKNOWN
}
