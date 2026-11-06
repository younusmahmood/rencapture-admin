import { createServerFn } from '@tanstack/react-start'
import { api } from '#/lib/api'
import { convex, friendlyError } from './convex'
import { endSession, readSession, startSession } from './session'

/**
 * Email-OTP sign-in restricted to the operator allowlist
 * (convex/lib/operatorAccess.ts). There is no signup here — the allowlist is
 * the only way in, and it's a code change on the backend, not something this
 * app can grant.
 */

export const requestCode = createServerFn({ method: 'POST' })
  .validator((d: { email: string }) => ({ email: String(d.email ?? '').trim() }))
  .handler(async ({ data }) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { ok: false as const, error: 'That email address looks wrong.' }
    }
    try {
      const res = await convex().action(api.operator.requestCode, { email: data.email })
      return { ok: true as const, devCode: res.devCode }
    } catch (e) {
      return { ok: false as const, error: friendlyError(e) }
    }
  })

export const verifyCode = createServerFn({ method: 'POST' })
  .validator((d: { email: string; code: string }) => ({
    email: String(d.email ?? '').trim(),
    code: String(d.code ?? '').trim(),
  }))
  .handler(async ({ data }) => {
    try {
      const res = await convex().action(api.operator.verifyCode, {
        email: data.email,
        code: data.code,
        platform: 'admin-web',
      })
      await startSession(res.sessionToken)
      return { ok: true as const }
    } catch (e) {
      return { ok: false as const, error: friendlyError(e) }
    }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await readSession()
  if (session.token) {
    try {
      await convex().mutation(api.operator.signOut, { sessionToken: session.token })
    } catch {
      // Session may already be gone server-side; clearing the cookie is what
      // actually matters.
    }
  }
  await endSession()
  return { ok: true as const }
})

export const getProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await readSession()
  if (!session.token) return { profile: null, reason: session.reason }
  try {
    const profile = await convex().query(api.operator.me, { sessionToken: session.token })
    if (!profile) {
      await endSession()
      return { profile: null, reason: 'revoked' as const }
    }
    return { profile }
  } catch {
    await endSession()
    return { profile: null, reason: 'revoked' as const }
  }
})
