import { Outlet, createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { getProfile, signOut } from '#/server/auth.fn'
import { Button } from '#/components/ui'

/** Gated shell for every operator screen. Everything under here requires an authorized session. */
export const Route = createFileRoute('/clinics')({
  beforeLoad: async () => {
    const { profile, reason } = await getProfile()
    if (!profile) throw redirect({ to: '/sign-in', search: { reason: reason ?? 'none' } })
    return { profile }
  },
  loader: ({ context }) => ({ profile: context.profile }),
  component: ClinicsLayout,
})

function ClinicsLayout() {
  const { profile } = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const doSignOut = async () => {
    setBusy(true)
    await signOut()
    await router.invalidate()
    navigate({ to: '/sign-in', search: { reason: 'none' } })
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-app-border bg-app-bg/90 px-6 backdrop-blur-md">
        <a href="/clinics" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-app-accent text-[13px] font-black text-app-on-accent">
            R
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-app-text">RenCapture Admin</p>
            <p className="app-mono text-[10px] text-app-3">{profile.email}</p>
          </div>
        </a>
        <Button variant="ghost" onClick={() => void doSignOut()} loading={busy}>
          <LogOut size={15} />
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
