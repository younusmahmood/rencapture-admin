import { makeFunctionReference } from 'convex/server'

/**
 * Typed handles onto the Convex backend shared with `../rencapture` (mobile)
 * and `../rencapture-web` (clinic console). Hand-declared, not imported from
 * either sibling's generated API — all three repos ship independently, so
 * this file is the contract for the `operator.ts` / `auth.ts` surface this
 * app actually calls, and it's kept in sync by hand.
 */

export interface OperatorProfile {
  email: string
  role: 'operator'
}

export type ClinicStatus = 'active' | 'disabled'

export interface ClinicRow {
  id: string
  name: string
  address?: string
  phone?: string
  status: ClinicStatus
  createdAt: number
  memberCount: number
  activeMemberCount: number
  primaryContact: { name: string; email: string } | null
}

export interface ClinicMember {
  id: string
  name: string
  email: string
  title?: string
  role: 'admin' | 'physician' | 'staff' | 'viewer' | 'scribe'
  status: 'invited' | 'active' | 'disabled'
  lastActiveAt?: number
  createdAt: number
}

export interface ClinicDetail {
  id: string
  name: string
  address?: string
  phone?: string
  status: ClinicStatus
  createdAt: number
  members: ClinicMember[]
}

type Token = { sessionToken: string }

export const api = {
  operator: {
    requestCode: makeFunctionReference<
      'action',
      { email: string },
      { sent: boolean; devCode?: string }
    >('operator:requestCode'),
    verifyCode: makeFunctionReference<
      'action',
      { email: string; code: string; platform?: string },
      { sessionToken: string; email: string }
    >('operator:verifyCode'),
    me: makeFunctionReference<'query', Token, OperatorProfile | null>('operator:me'),
    signOut: makeFunctionReference<'mutation', Token, null>('operator:signOut'),

    listClinics: makeFunctionReference<'query', Token, ClinicRow[]>(
      'operator:listClinics',
    ),
    getClinic: makeFunctionReference<
      'query',
      Token & { clinicId: string },
      ClinicDetail | null
    >('operator:getClinic'),
    provisionClinic: makeFunctionReference<
      'action',
      Token & {
        clinicName: string
        address?: string
        phone?: string
        adminName: string
        adminEmail: string
        adminTitle?: string
      },
      { clinicId: string }
    >('operator:provisionClinic'),
    setClinicStatus: makeFunctionReference<
      'mutation',
      Token & { clinicId: string; status: ClinicStatus },
      null
    >('operator:setClinicStatus'),
    updateClinic: makeFunctionReference<
      'mutation',
      Token & { clinicId: string; name?: string; address?: string; phone?: string },
      null
    >('operator:updateClinic'),
  },
}
