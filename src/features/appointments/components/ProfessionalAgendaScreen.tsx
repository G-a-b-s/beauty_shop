import {
  formatFullDateLabel,
  formatMonthLabel,
  formatTimeLabel,
  isSameDay,
} from '../../../shared/lib/date'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCurrentProfessionalId } from '../../professionals/hooks/useCurrentProfessionalId'
import { useProfessionalAgenda, type AgendaView } from '../hooks/useProfessionalAgenda'
import type { Appointment } from '../types'

const viewOptions: { value: AgendaView; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

const weekdayInitials = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

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
  } = useProfessionalAgenda(professionalId)

  const periodLabel =
    view === 'month' ? formatMonthLabel(referenceDate) : formatFullDateLabel(referenceDate)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900">Minha agenda</h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-neutral-100 p-1">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                view === option.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={goToPrevious}>
            Anterior
          </Button>
          <Button variant="secondary" onClick={goToNext}>
            Próximo
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium capitalize text-neutral-700">{periodLabel}</p>

      {loading && <p className="mt-4 text-sm text-neutral-500">Carregando…</p>}

      {!loading && view === 'day' && (
        <div className="mt-3 grid gap-3">
          {(appointmentsByDay.get(referenceDate.toDateString()) ?? []).length === 0 && (
            <p className="text-sm text-neutral-500">Nenhum agendamento neste dia</p>
          )}
          {(appointmentsByDay.get(referenceDate.toDateString()) ?? []).map((appointment) => (
            <Card key={appointment.id} className="p-5">
              <p className="font-medium text-neutral-900">
                {formatTimeLabel(new Date(appointment.start))} –{' '}
                {formatTimeLabel(new Date(appointment.end))}
              </p>
              <p className="text-sm text-neutral-500">
                {appointment.customerName} · {appointment.serviceName}
              </p>
            </Card>
          ))}
        </div>
      )}

      {!loading && view === 'week' && (
        <div className="mt-3 grid grid-cols-7 gap-2">
          {visibleDays.map((day) => (
            <div key={day.toISOString()} className="rounded-xl bg-white p-2">
              <button
                type="button"
                onClick={() => openDay(day)}
                className="mb-2 w-full text-left text-xs font-medium text-neutral-500"
              >
                {weekdayInitials[day.getDay()]} {day.getDate()}
              </button>
              <div className="grid gap-1">
                {(appointmentsByDay.get(day.toDateString()) ?? []).map((appointment) => (
                  <AppointmentLine key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && view === 'month' && (
        <div className="mt-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-400">
            {weekdayInitials.map((initial, index) => (
              <span key={`${initial}-${index}`}>{initial}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {visibleDays.map((day) => {
              const dayAppointments = appointmentsByDay.get(day.toDateString()) ?? []
              const isCurrentMonth = day.getMonth() === referenceDate.getMonth()
              const isToday = isSameDay(day, new Date())

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => openDay(day)}
                  className={`aspect-square rounded-lg border p-1 text-left text-xs transition-colors ${
                    isCurrentMonth ? 'bg-white text-neutral-700' : 'bg-neutral-50 text-neutral-300'
                  } ${isToday ? 'border-primary-500' : 'border-neutral-100'}`}
                >
                  <span className="font-medium">{day.getDate()}</span>
                  {dayAppointments.length > 0 && (
                    <span className="mt-1 block rounded-full bg-primary-100 text-center text-[10px] font-medium text-primary-700">
                      {dayAppointments.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
