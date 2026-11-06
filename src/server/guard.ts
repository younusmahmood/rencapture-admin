import { redirect } from '@tanstack/react-router'
import {
  requireOperatorProfile,
  requireToken,
  SessionEndedError,
  type SessionEnd,
} from './session'
import { convexErrorCode } from './convex'
import type { OperatorProfile } from '#/lib/api'

function signInRedirect(reason: SessionEnd): never {
  throw redirect({ to: '/sign-in', search: { reason } })
}

export async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  let token: string
  try {
    token = await requireToken()
  } catch (e) {
    if (e instanceof SessionEndedError) signInRedirect(e.reason)
    throw e
  }
  try {
    return await fn(token)
  } catch (e) {
    const code = convexErrorCode(e)
    if (code === 'UNAUTHENTICATED' || code === 'SESSION_EXPIRED' || code === 'NOT_AUTHORIZED') {
      signInRedirect('revoked')
    }
    throw e
  }
}

export async function withProfile<T>(
  fn: (ctx: { token: string; profile: OperatorProfile }) => Promise<T>,
): Promise<T> {
  let ctx: { token: string; profile: OperatorProfile }
  try {
    ctx = await requireOperatorProfile()
  } catch (e) {
    if (e instanceof SessionEndedError) signInRedirect(e.reason)
    throw e
  }
  try {
    return await fn(ctx)
  } catch (e) {
    const code = convexErrorCode(e)
    if (code === 'UNAUTHENTICATED' || code === 'SESSION_EXPIRED' || code === 'NOT_AUTHORIZED') {
      signInRedirect('revoked')
    }
    throw e
  }
}
