import { createServerFn } from '@tanstack/react-start'
import { api } from '#/lib/api'
import { convex, friendlyError } from './convex'
import { withProfile, withToken } from './guard'

/** Clinic provisioning and management. */

export const listClinics = createServerFn({ method: 'GET' }).handler(async () =>
  withToken((sessionToken) => convex().query(api.operator.listClinics, { sessionToken })),
)

export const getClinic = createServerFn({ method: 'GET' })
  .validator((d: { clinicId: string }) => ({ clinicId: String(d.clinicId) }))
  .handler(async ({ data }) =>
    withToken((sessionToken) =>
      convex().query(api.operator.getClinic, { sessionToken, clinicId: data.clinicId }),
    ),
  )

export const provisionClinic = createServerFn({ method: 'POST' })
  .validator(
    (d: {
      clinicName: string
      address?: string
      phone?: string
      adminName: string
      adminEmail: string
      adminTitle?: string
    }) => d,
  )
  .handler(async ({ data }) =>
    withProfile(async ({ token }) => {
      try {
        const res = await convex().action(api.operator.provisionClinic, {
          sessionToken: token,
          clinicName: data.clinicName.trim(),
          address: data.address?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
          adminName: data.adminName.trim(),
          adminEmail: data.adminEmail.trim(),
          adminTitle: data.adminTitle?.trim() || undefined,
        })
        return { ok: true as const, clinicId: res.clinicId }
      } catch (e) {
        return { ok: false as const, error: friendlyError(e) }
      }
    }),
  )

export const setClinicStatus = createServerFn({ method: 'POST' })
  .validator((d: { clinicId: string; status: 'active' | 'disabled' }) => d)
  .handler(async ({ data }) =>
    withProfile(async ({ token }) => {
      try {
        await convex().mutation(api.operator.setClinicStatus, {
          sessionToken: token,
          clinicId: data.clinicId,
          status: data.status,
        })
        return { ok: true as const }
      } catch (e) {
        return { ok: false as const, error: friendlyError(e) }
      }
    }),
  )

export const updateClinic = createServerFn({ method: 'POST' })
  .validator(
    (d: { clinicId: string; name?: string; address?: string; phone?: string }) => d,
  )
  .handler(async ({ data }) =>
    withProfile(async ({ token }) => {
      try {
        await convex().mutation(api.operator.updateClinic, {
          sessionToken: token,
          clinicId: data.clinicId,
          name: data.name?.trim(),
          address: data.address?.trim(),
          phone: data.phone?.trim(),
        })
        return { ok: true as const }
      } catch (e) {
        return { ok: false as const, error: friendlyError(e) }
      }
    }),
  )
