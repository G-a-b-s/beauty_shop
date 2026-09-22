import { formatTimeLabel } from '../../../shared/lib/date'
import { ScheduleView } from '../../../shared/ui/ScheduleView'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useBusinessSchedule } from '../hooks/useBusinessSchedule'
import type { Appointment, AppointmentStatus } from '../types'

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  noShow: 'Falta',
}

function AppointmentLine({ appointment }: { appointment: Appointment }) {
  return (
    <div className="rounded-lg bg-primary-50 px-2 py-1 text-xs text-primary-800">
      <span className="font-medium">{formatTimeLabel(new Date(appointment.start))}</span>{' '}
      {appointment.customerName}
    </div>
  )
}

export function BusinessScheduleScreen() {
  const businessId = useCurrentBusinessId()
  const {
    loading,
    view,
    setView,
    referenceDate,
    visibleDays,
    appointmentsByDay,
    goToPrevious,
    goToNext,
    openDay,
    updateStatus,
  } = useBusinessSchedule(businessId)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">Agenda</h1>

      <ScheduleView
        loading={loading}
        view={view}
        setView={setView}
        referenceDate={referenceDate}
        visibleDays={visibleDays}
        appointmentsByDay={appointmentsByDay}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        openDay={openDay}
        getItemKey={(appointment) => appointment.id}
        renderDay={(appointments) => (
          <div className="grid gap-3">
            {appointments.length === 0 && (
              <p className="text-sm text-neutral-500">Nenhum agendamento nesta data</p>
            )}
            {appointments.map((appointment) => (
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
                    <Button
                      variant="secondary"
                      onClick={() => updateStatus(appointment.id, 'noShow')}
                    >
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
        )}
        renderWeekItem={(appointment) => <AppointmentLine appointment={appointment} />}
      />
    </div>
  )
}
