import { useSession } from '@tanstack/react-start/server'
import { api, type OperatorProfile } from '#/lib/api'
import { convex, convexErrorCode } from './convex'

/**
 * Operator session. Same mechanism as rencapture-web's console session
 * (sealed AES-256 + HMAC httpOnly cookie via TanStack's session helper) but
 * a distinct cookie name and a distinct `SESSION_SECRET` — if the console's
 * secret ever leaked, operator sessions must not be forgeable with it, and
 * vice versa.
 *
 * Timeouts match the console's: 15 minutes idle, 12 hours absolute. This
 * account can provision or disable *any* clinic, so it gets no more slack
 * than the surface it's stricter than everything else in the product.
 */

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000

interface AdminSession {
  token: string
  issuedAt: number
  lastSeen: number
}

function sessionPassword(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to a random string of at least 32 characters.',
    )
  }
  return secret
}

function sessionConfig() {
  return {
    password: sessionPassword(),
    name: 'rc_admin',
    maxAge: Math.floor(ABSOLUTE_TIMEOUT_MS / 1000),
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  }
}

export async function startSession(token: string): Promise<void> {
  const session = await useSession<AdminSession>(sessionConfig())
  const now = Date.now()
  await session.update({ token, issuedAt: now, lastSeen: now })
}

export async function endSession(): Promise<void> {
  const session = await useSession<AdminSession>(sessionConfig())
  await session.clear()
}

export type SessionEnd = 'idle' | 'expired' | 'revoked' | 'none'

export async function readSession(): Promise<{
  token: string | null
  reason: SessionEnd
}> {
  const session = await useSession<AdminSession>(sessionConfig())
  const data = session.data
  if (!data?.token) return { token: null, reason: 'none' }

  const now = Date.now()
  if (now - (data.lastSeen ?? 0) > IDLE_TIMEOUT_MS) {
    await session.clear()
    return { token: null, reason: 'idle' }
  }
  if (now - (data.issuedAt ?? 0) > ABSOLUTE_TIMEOUT_MS) {
    await session.clear()
    return { token: null, reason: 'expired' }
  }
  await session.update({ lastSeen: now })
  return { token: data.token, reason: 'none' }
}

export class SessionEndedError extends Error {
  constructor(public reason: SessionEnd) {
    super(`SESSION_${reason.toUpperCase()}`)
    this.name = 'SessionEndedError'
  }
}

export async function requireToken(): Promise<string> {
  const result = await readSession()
  if (!result.token) throw new SessionEndedError(result.reason)
  return result.token
}

export async function requireOperatorProfile(): Promise<{
  token: string
  profile: OperatorProfile
}> {
  const token = await requireToken()
  let profile: OperatorProfile | null = null
  try {
    profile = await convex().query(api.operator.me, { sessionToken: token })
  } catch (e) {
    if (convexErrorCode(e) !== 'UNKNOWN') profile = null
    else throw e
  }
  if (!profile) {
    await endSession()
    throw new SessionEndedError('revoked')
  }
  return { token, profile }
}
