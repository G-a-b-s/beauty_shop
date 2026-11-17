import { useState } from 'react'
import { formatDateTimeLabel, formatTimeLabel } from '../../../shared/lib/date'
import { ScheduleView } from '../../../shared/ui/ScheduleView'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useConfirm } from '../../../shared/ui/useConfirm'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useBusinessSchedule } from '../hooks/useBusinessSchedule'
import type { Appointment, AppointmentStatus } from '../types'
import { statusLabels } from './statusLabels'

type FinalStatus = Exclude<AppointmentStatus, 'scheduled'>

const statusConfirmations: Record<FinalStatus, { title: string; confirmLabel: string }> = {
  completed: { title: 'Registrar como realizado?', confirmLabel: 'Registrar realizado' },
  noShow: { title: 'Registrar falta do cliente?', confirmLabel: 'Registrar falta' },
  cancelled: { title: 'Cancelar este agendamento?', confirmLabel: 'Cancelar agendamento' },
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
    updatingId,
    updateError,
  } = useBusinessSchedule(businessId)
  const { confirm, dialog } = useConfirm()
  const [message, setMessage] = useState<string | null>(null)

  async function handleStatus(appointment: Appointment, status: FinalStatus) {
    const { title, confirmLabel } = statusConfirmations[status]
    const confirmed = await confirm({
      title,
      description: (
        <>
          <p>
            {appointment.customerName} · {appointment.serviceName} com{' '}
            {appointment.professionalName}
          </p>
          <p>{formatDateTimeLabel(new Date(appointment.start))}</p>
          <p className="mt-2">Depois de registrado, o status não pode ser alterado.</p>
        </>
      ),
      confirmLabel,
      tone: status === 'completed' ? 'primary' : 'danger',
    })
    if (confirmed) {
      setMessage(null)
      if (await updateStatus(appointment.id, status)) {
        setMessage(
          `${appointment.customerName} às ${formatTimeLabel(new Date(appointment.start))}: ` +
            `registrado como ${statusLabels[status]}`,
        )
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">Agenda</h1>
      {dialog}

      {message && <p className="mt-2 text-sm text-primary-700">{message}</p>}
      {updateError && <p className="mt-2 text-sm text-red-600">{updateError}</p>}

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
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={updatingId !== null}
                      onClick={() => handleStatus(appointment, 'completed')}
                    >
                      Realizado
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={updatingId !== null}
                      onClick={() => handleStatus(appointment, 'noShow')}
                    >
                      Falta
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={updatingId !== null}
                      onClick={() => handleStatus(appointment, 'cancelled')}
                    >
                      Cancelar
                    </Button>
                    {updatingId === appointment.id && (
                      <span className="text-sm text-neutral-500">Salvando…</span>
                    )}
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
