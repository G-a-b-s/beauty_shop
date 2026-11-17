import {
  formatTimeLabel,
} from '../../../shared/lib/date'
import { ScheduleView } from '../../../shared/ui/ScheduleView'
import { Card } from '../../../shared/ui/Card'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useCurrentProfessionalId } from '../../professionals/hooks/useCurrentProfessionalId'
import { useProfessionalAgenda } from '../hooks/useProfessionalAgenda'
import type { Appointment } from '../types'
import { statusLabels } from './statusLabels'

function AppointmentLine({ appointment }: { appointment: Appointment }) {
  return (
    <div className="rounded-lg bg-primary-50 px-2 py-1 text-xs text-primary-800">
      <span className="font-medium">{formatTimeLabel(new Date(appointment.start))}</span>{' '}
      {appointment.customerName}
    </div>
  )
}

export function ProfessionalAgendaScreen() {
  const professionalId = useCurrentProfessionalId()
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
  } = useProfessionalAgenda(businessId, professionalId)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900">Minha agenda</h1>

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
              <p className="text-sm text-neutral-500">Nenhum agendamento neste dia</p>
            )}
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-neutral-900">
                    {formatTimeLabel(new Date(appointment.start))} –{' '}
                    {formatTimeLabel(new Date(appointment.end))}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {appointment.customerName} · {appointment.serviceName}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-primary-700">
                  {statusLabels[appointment.status]}
                </span>
              </Card>
            ))}
          </div>
        )}
        renderWeekItem={(appointment) => <AppointmentLine appointment={appointment} />}
      />
    </div>
  )
}
