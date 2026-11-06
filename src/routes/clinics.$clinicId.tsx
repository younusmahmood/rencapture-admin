import { useState } from 'react'
import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Power } from 'lucide-react'
import { getClinic, setClinicStatus, updateClinic } from '#/server/operator.fn'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Table,
  Td,
  Th,
} from '#/components/ui'

export const Route = createFileRoute('/clinics/$clinicId')({
  loader: async ({ params }) => {
    const clinic = await getClinic({ data: { clinicId: params.clinicId } })
    if (!clinic) throw notFound()
    return clinic
  },
  component: ClinicDetail,
})

function ClinicDetail() {
  const clinic = Route.useLoaderData()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const isActive = clinic.status === 'active'

  const toggleStatus = async () => {
    setBusy(true)
    const res = await setClinicStatus({
      data: { clinicId: clinic.id, status: isActive ? 'disabled' : 'active' },
    })
    setBusy(false)
    setConfirmOpen(false)
    if (!res.ok) return
    await router.invalidate()
  }

  return (
    <>
      <Link
        to="/clinics"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-app-2 hover:text-app-text"
      >
        <ArrowLeft size={14} />
        All clinics
      </Link>

      <PageHeader
        eyebrow="Clinic"
        title={clinic.name}
        description={[clinic.address, clinic.phone].filter(Boolean).join(' · ') || undefined}
        actions={
          <>
            <Badge tone={isActive ? 'success' : 'danger'}>{clinic.status}</Badge>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil size={15} />
              Edit
            </Button>
            <Button
              variant={isActive ? 'danger' : 'secondary'}
              onClick={() => setConfirmOpen(true)}
            >
              <Power size={15} />
              {isActive ? 'Disable clinic' : 'Re-enable clinic'}
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader
          title="Members"
          subtitle={`${clinic.members.length} member${clinic.members.length === 1 ? '' : 's'}`}
        />
        {clinic.members.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No members yet" message="The first admin was just created and hasn't signed in." />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {clinic.members.map((m) => (
                <tr key={m.id} className="hover:bg-app-surface-alt">
                  <Td>
                    <span className="font-semibold">{m.name}</span>
                    {m.title ? <span className="ml-1.5 text-[12px] text-app-3">{m.title}</span> : null}
                  </Td>
                  <Td>
                    <span className="app-mono text-[12px]">{m.email}</span>
                  </Td>
                  <Td>
                    <Badge tone={m.role === 'admin' ? 'accent' : 'neutral'}>{m.role}</Badge>
                  </Td>
                  <Td>
                    <Badge
                      tone={m.status === 'active' ? 'success' : m.status === 'invited' ? 'amber' : 'danger'}
                    >
                      {m.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <EditModal open={editOpen} onClose={() => setEditOpen(false)} clinic={clinic} />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isActive ? 'Disable this clinic?' : 'Re-enable this clinic?'}
        width={440}
      >
        <p className="text-[13px] leading-relaxed text-app-2">
          {isActive
            ? 'Every member loses access immediately — active sessions on the mobile app and the web console are revoked, and nobody can sign in until this clinic is re-enabled.'
            : 'Members can sign in again once this is confirmed.'}
        </p>
        <div className="flex justify-end gap-2 pt-5">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant={isActive ? 'danger' : 'primary'} loading={busy} onClick={() => void toggleStatus()}>
            {isActive ? 'Disable clinic' : 'Re-enable clinic'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

function EditModal({
  open,
  onClose,
  clinic,
}: {
  open: boolean
  onClose: () => void
  clinic: { id: string; name: string; address?: string; phone?: string }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: clinic.name,
    address: clinic.address ?? '',
    phone: clinic.phone ?? '',
  })

  const submit = async () => {
    setBusy(true)
    const res = await updateClinic({ data: { clinicId: clinic.id, ...form } })
    setBusy(false)
    if (!res.ok) return
    onClose()
    await router.invalidate()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit clinic">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Input
          label="Clinic name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!form.name.trim()} loading={busy}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}
