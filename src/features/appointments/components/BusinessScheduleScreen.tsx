import { formatTimeLabel } from '../../../shared/lib/date'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useBusinessSchedule } from '../hooks/useBusinessSchedule'
import type { AppointmentStatus } from '../types'

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  noShow: 'Falta',
}

export function BusinessScheduleScreen() {
  const businessId = useCurrentBusinessId()
  const { dayAppointments, loading, selectedDateKey, setSelectedDateKey, updateStatus } =
    useBusinessSchedule(businessId)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">Agenda</h1>

      <div className="mt-4 max-w-xs">
        <Input
          label="Data"
          type="date"
          value={selectedDateKey}
          onChange={(e) => setSelectedDateKey(e.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-neutral-500">Carregando…</p>}

        {!loading && dayAppointments.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum agendamento nesta data</p>
        )}

        {dayAppointments.map((appointment) => (
          <Card key={appointment.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-neutral-900">
                  {formatTimeLabel(new Date(appointment.start))} –{' '}
                  {formatTimeLabel(new Date(appointment.end))}
                </p>
                <p className="text-sm text-neutral-500">
                  {appointment.customerName} · {appointment.serviceName}
                </p>
                <p className="text-sm text-neutral-500">{appointment.professionalName}</p>
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-primary-700">
                {statusLabels[appointment.status]}
              </span>
            </div>

            {appointment.status === 'scheduled' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => updateStatus(appointment.id, 'completed')}
                >
                  Realizado
                </Button>
                <Button variant="secondary" onClick={() => updateStatus(appointment.id, 'noShow')}>
                  Falta
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => updateStatus(appointment.id, 'cancelled')}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
