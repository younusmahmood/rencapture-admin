import { useEffect, useRef, useState } from 'react'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { getProfile, requestCode, verifyCode } from '#/server/auth.fn'
import { Button, ErrorNote, Input, cx } from '#/components/ui'

const REASONS: Record<string, string> = {
  idle: 'You were signed out after 15 minutes of inactivity.',
  expired: 'Your session reached its 12-hour limit. Sign in again to continue.',
  revoked: 'Your session ended. Sign in again to continue.',
}

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>) => ({
    reason: typeof search.reason === 'string' ? search.reason : 'none',
  }),
  beforeLoad: async ({ search }) => {
    if (search.reason === 'none') {
      const { profile } = await getProfile()
      if (profile) throw redirect({ to: '/clinics' })
    }
  },
  component: SignIn,
})

function SignIn() {
  const { reason } = Route.useSearch()
  const router = useRouter()
  const navigate = useNavigate()

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const sendCode = async () => {
    setBusy(true)
    setError(null)
    const res = await requestCode({ data: { email: email.trim() } })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDevCode(res.devCode)
    setStep('code')
  }

  const submitCode = async () => {
    setBusy(true)
    setError(null)
    const res = await verifyCode({ data: { email: email.trim(), code: code.trim() } })
    if (!res.ok) {
      setBusy(false)
      setError(res.error)
      return
    }
    await router.invalidate()
    navigate({ to: '/clinics' })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-app-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-app-accent text-[13px] font-black text-app-on-accent">
            R
          </span>
          <div>
            <p className="text-[15px] font-bold text-app-text">RenCapture Admin</p>
            <p className="app-mono text-[11px] text-app-3">operator console</p>
          </div>
        </div>

        {reason !== 'none' && REASONS[reason] ? (
          <p className="mb-6 rounded-lg border border-app-border bg-app-surface-alt px-3 py-2.5 text-[13px] text-app-2">
            {REASONS[reason]}
          </p>
        ) : null}

        {step === 'email' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (emailValid) void sendCode()
            }}
          >
            <h1 className="text-xl font-bold text-app-text">Sign in</h1>
            <p className="mt-1.5 text-sm text-app-2">
              Restricted to authorized RenCapture operators.
            </p>
            <div className="mt-6 space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@theymsgroup.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error ? <ErrorNote>{error}</ErrorNote> : null}
              <Button type="submit" className="w-full" disabled={!emailValid} loading={busy}>
                Send code
                <ArrowRight size={16} />
              </Button>
            </div>
            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-app-border bg-app-surface px-3 py-2.5">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-app-accent" />
              <p className="text-[11px] leading-relaxed text-app-3">
                This tool provisions and disables clinics. Access is not
                self-service — only pre-authorized addresses can sign in.
              </p>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (code.trim().length === 6) void submitCode()
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
              className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-app-2 hover:text-app-text"
            >
              <ArrowLeft size={14} />
              Use a different email
            </button>

            <h1 className="text-xl font-bold text-app-text">Enter your code</h1>
            <p className="mt-1.5 text-sm text-app-2">
              If <span className="font-semibold text-app-text">{email}</span> is
              authorized, a code was sent. It expires in 10 minutes.
            </p>

            {devCode ? (
              <p className="mt-5 rounded-lg border border-app-amber/30 bg-app-amber-soft px-3 py-2.5 text-[12px] text-app-amber">
                <span className="font-bold">Development mode</span> — code is{' '}
                <span className="app-mono font-bold">{devCode}</span>.
              </p>
            ) : null}

            <div className="mt-6 space-y-4">
              <input
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-label="Six-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={cx(
                  'app-mono h-16 w-full rounded-lg border border-app-border bg-app-elevated text-center text-[28px] tracking-[0.4em] text-app-text',
                  'transition-colors duration-200 ease-[var(--ease-smooth)] focus:border-app-accent focus:outline-none',
                )}
              />
              {error ? <ErrorNote>{error}</ErrorNote> : null}
              <Button type="submit" className="w-full" disabled={code.trim().length !== 6} loading={busy}>
                Sign in
              </Button>
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={busy}
                className="w-full text-[13px] font-semibold text-app-2 hover:text-app-accent disabled:opacity-50"
              >
                Send a new code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
