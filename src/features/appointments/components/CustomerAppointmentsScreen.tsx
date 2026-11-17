import { useLocation } from 'react-router-dom'
import { formatDateTimeLabel } from '../../../shared/lib/date'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useConfirm } from '../../../shared/ui/useConfirm'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCustomerAppointments } from '../hooks/useCustomerAppointments'
import type { Appointment } from '../types'
import { statusLabels } from './statusLabels'


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
  const { upcoming, history, loading, cancel, error, message } = useCustomerAppointments(
    account?.uid ?? '',
  )
  const { confirm, dialog } = useConfirm()
  const bookedMessage = (useLocation().state as { message?: string } | null)?.message

  async function handleCancel(appointment: Appointment) {
    const confirmed = await confirm({
      title: 'Cancelar agendamento?',
      description: (
        <>
          <p>
            {appointment.serviceName} com {appointment.professionalName}
          </p>
          <p>
            {appointment.businessName} · {formatDateTimeLabel(new Date(appointment.start))}
          </p>
          <p className="mt-2">O horário volta a ficar livre e o cancelamento não pode ser desfeito.</p>
        </>
      ),
      confirmLabel: 'Cancelar agendamento',
      tone: 'danger',
    })
    if (confirmed) {
      await cancel(appointment.id)
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <section>
        <h1 className="text-xl font-semibold text-neutral-900">Próximos</h1>
        {(message ?? bookedMessage) && (
          <p className="mt-2 text-sm text-primary-700">{message ?? bookedMessage}</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 grid gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-neutral-500">Nenhum agendamento futuro</p>
          )}
          {upcoming.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={() => handleCancel(appointment)}
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
      {dialog}
    </div>
  )
}
