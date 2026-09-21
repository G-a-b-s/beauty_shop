import { formatDateTimeLabel } from '../../../shared/lib/date'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCustomerAppointments } from '../hooks/useCustomerAppointments'
import type { Appointment, AppointmentStatus } from '../types'

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  noShow: 'Falta',
}

function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment
  onCancel?: () => void
}) {
  return (
    <Card className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="font-medium text-neutral-900">{appointment.serviceName}</p>
        <p className="text-sm text-neutral-500">
          {appointment.businessName} · {appointment.professionalName}
        </p>
        <p className="text-sm text-neutral-500">
          {formatDateTimeLabel(new Date(appointment.start))}
        </p>
        <span className="mt-1 inline-block text-xs font-medium text-primary-700">
          {statusLabels[appointment.status]}
        </span>
      </div>
      {onCancel && (
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </Card>
  )
}

export function CustomerAppointmentsScreen() {
  const { account } = useAuth()
  const { upcoming, history, loading, cancel } = useCustomerAppointments(
    account?.uid ?? '',
    account?.name ?? '',
  )

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <section>
        <h1 className="text-xl font-semibold text-neutral-900">Próximos</h1>
        <div className="mt-3 grid gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhum agendamento futuro</p>
          )}
          {upcoming.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={() => cancel(appointment.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-neutral-900">Histórico</h2>
        <div className="mt-3 grid gap-3">
          {history.length === 0 && <p className="text-sm text-neutral-500">Nenhum atendimento anterior</p>}
          {history.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </section>
    </div>
  )
}
