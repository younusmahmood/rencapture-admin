import { forwardRef, useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'

/** Small, deliberately un-abstracted UI kit — this app is a handful of screens. */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export type Tone = 'accent' | 'success' | 'amber' | 'danger' | 'neutral'

const TONE_SOFT: Record<Tone, string> = {
  accent: 'bg-app-accent-soft text-app-accent',
  success: 'bg-app-success-soft text-app-success',
  amber: 'bg-app-amber-soft text-app-amber',
  danger: 'bg-app-danger-soft text-app-danger',
  neutral: 'bg-app-surface-alt text-app-2',
}

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-app-accent text-app-on-accent hover:brightness-110',
  secondary: 'bg-app-accent-soft text-app-accent hover:bg-app-accent hover:text-app-on-accent',
  outline: 'border border-app-border-strong text-app-text hover:bg-app-surface-alt bg-transparent',
  ghost: 'text-app-2 hover:bg-app-surface-alt hover:text-app-text bg-transparent',
  danger: 'bg-app-danger text-white hover:brightness-110',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background-color,filter,opacity] duration-200 ease-[var(--ease-smooth)] disabled:cursor-not-allowed disabled:opacity-45',
        BUTTON_VARIANTS[variant],
        className,
      )}
    >
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
})

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-xl border border-app-border bg-app-surface', className)}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-app-border px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-app-text">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] text-app-2">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="app-mono text-xs font-semibold uppercase tracking-widest text-app-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-[26px] font-bold text-app-text">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-app-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide',
        TONE_SOFT[tone],
      )}
    >
      {children}
    </span>
  )
}

const FIELD_BASE =
  'w-full rounded-lg border border-app-border bg-app-elevated px-3 text-sm text-app-text placeholder:text-app-3 transition-colors duration-200 ease-[var(--ease-smooth)] focus:border-app-accent focus:outline-none disabled:opacity-50'

interface FieldProps {
  label?: string
  hint?: string
  required?: boolean
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input({ label, hint, required, className, ...rest }, ref) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-[13px] font-semibold text-app-2">
          {label}
          {required ? <span className="text-app-danger"> *</span> : null}
        </span>
      ) : null}
      <input ref={ref} required={required} {...rest} className={cx(FIELD_BASE, 'h-10', className)} />
      {hint ? <span className="mt-1 block text-[12px] text-app-3">{hint}</span> : null}
    </label>
  )
})

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-app-danger/30 bg-app-danger-soft px-3 py-2 text-[13px] font-medium text-app-danger"
    >
      {children}
    </p>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-app-border px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-app-3">{icon}</div> : null}
      <p className="text-[15px] font-bold text-app-text">{title}</p>
      {message ? <p className="mt-1.5 max-w-sm text-sm text-app-2">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 480,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  width?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ maxWidth: width }}
        className="max-h-[88vh] w-full overflow-y-auto rounded-xl border border-app-border bg-app-elevated shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-lg font-bold text-app-text">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-app-2">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-2 text-app-3 hover:bg-app-surface-alt hover:text-app-text"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 pt-5">{children}</div>
      </div>
    </div>
  )
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">{children}</table>
    </div>
  )
}

export function Th({ children, align = 'left' }: { children?: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cx(
        'app-mono whitespace-nowrap border-b border-app-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-app-3',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  className,
}: {
  children?: ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <td
      className={cx(
        'border-b border-app-border px-4 py-3 text-sm text-app-text',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  )
}
