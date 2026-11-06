import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { listClinics, provisionClinic } from '#/server/operator.fn'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Table,
  Td,
  Th,
} from '#/components/ui'
import type { ClinicRow } from '#/lib/api'

export const Route = createFileRoute('/clinics/')({
  loader: () => listClinics(),
  component: ClinicsIndex,
})

function ClinicsIndex() {
  const clinics = Route.useLoaderData()
  const [provisionOpen, setProvisionOpen] = useState(false)

  const active = clinics.filter((c) => c.status === 'active')

  return (
    <>
      <PageHeader
        eyebrow={`${clinics.length} clinic${clinics.length === 1 ? '' : 's'} · ${active.length} active`}
        title="Clinics"
        description="Every clinic provisioned on RenCapture. New clinics start here — there is no self-service signup."
        actions={
          <Button onClick={() => setProvisionOpen(true)}>
            <Plus size={16} />
            Provision clinic
          </Button>
        }
      />

      {clinics.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title="No clinics yet"
          message="Provision the first one to get started."
          action={
            <Button onClick={() => setProvisionOpen(true)}>
              <Plus size={16} />
              Provision clinic
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Clinic</Th>
                <Th>Primary contact</Th>
                <Th align="right">Members</Th>
                <Th>Status</Th>
                <Th align="right">Provisioned</Th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c) => (
                <ClinicRowView key={c.id} clinic={c} />
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <ProvisionModal open={provisionOpen} onClose={() => setProvisionOpen(false)} />
    </>
  )
}

function ClinicRowView({ clinic: c }: { clinic: ClinicRow }) {
  const router = useRouter()
  return (
    <tr
      onClick={() => router.navigate({ to: '/clinics/$clinicId', params: { clinicId: c.id } })}
      className="cursor-pointer transition-colors duration-200 ease-[var(--ease-smooth)] hover:bg-app-surface-alt"
    >
      <Td>
        <Link
          to="/clinics/$clinicId"
          params={{ clinicId: c.id }}
          className="font-bold text-app-text hover:text-app-accent"
        >
          {c.name}
        </Link>
        {c.address ? <span className="mt-0.5 block text-[12px] text-app-3">{c.address}</span> : null}
      </Td>
      <Td>
        {c.primaryContact ? (
          <>
            <span className="text-[13px]">{c.primaryContact.name}</span>
            <span className="app-mono ml-2 text-[11px] text-app-3">{c.primaryContact.email}</span>
          </>
        ) : (
          <span className="text-[13px] text-app-3">—</span>
        )}
      </Td>
      <Td align="right">
        <span className="app-mono text-[13px]">
          {c.activeMemberCount}
          <span className="text-app-3">/{c.memberCount}</span>
        </span>
      </Td>
      <Td>
        <Badge tone={c.status === 'active' ? 'success' : 'danger'}>{c.status}</Badge>
      </Td>
      <Td align="right">
        <span className="text-[13px] text-app-2">{new Date(c.createdAt).toLocaleDateString()}</span>
      </Td>
    </tr>
  )
}

function ProvisionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    clinicName: '',
    address: '',
    phone: '',
    adminName: '',
    adminEmail: '',
    adminTitle: '',
  })

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const valid =
    form.clinicName.trim().length > 1 &&
    form.adminName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())

  const submit = async () => {
    setBusy(true)
    setError(null)
    const res = await provisionClinic({ data: form })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    onClose()
    setForm({ clinicName: '', address: '', phone: '', adminName: '', adminEmail: '', adminTitle: '' })
    await router.invalidate()
    router.navigate({ to: '/clinics/$clinicId', params: { clinicId: res.clinicId } })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Provision a clinic"
      description="Creates the clinic and its first administrator. They sign in with this email — no password, no signup step on their end."
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) void submit()
        }}
      >
        <Input
          label="Clinic name"
          required
          autoFocus
          placeholder="Renovo Wound Care"
          value={form.clinicName}
          onChange={set('clinicName')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Address" placeholder="Optional" value={form.address} onChange={set('address')} />
          <Input label="Phone" placeholder="Optional" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="border-t border-app-border pt-4">
          <p className="mb-3 text-[13px] font-semibold text-app-2">First administrator</p>
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <Input
              label="Name"
              required
              placeholder="Dr. Amelia Reyes"
              value={form.adminName}
              onChange={set('adminName')}
            />
            <Input label="Title" placeholder="MD" value={form.adminTitle} onChange={set('adminTitle')} />
          </div>
          <div className="mt-4">
            <Input
              label="Email"
              type="email"
              required
              placeholder="amelia@clinic.com"
              value={form.adminEmail}
              onChange={set('adminEmail')}
            />
          </div>
        </div>
        {error ? <p className="text-[13px] font-medium text-app-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid} loading={busy}>
            Provision clinic
          </Button>
        </div>
      </form>
    </Modal>
  )
}
