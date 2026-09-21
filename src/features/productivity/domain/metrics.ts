import { addDays, combineDateAndTime, startOfDay, toDateKey } from '../../../shared/lib/date'
import type { Appointment, Shift, TimeOff, Weekday } from '../../../shared/lib/mockDb'

export type ProductivityMetrics = {
  completedCount: number
  busyMinutes: number
  availableMinutes: number
  occupancyRate: number
}

type MetricsInput = {
  professionalId: string
  shifts: Shift[]
  timeOff: TimeOff[]
  appointments: Appointment[]
  periodStart: Date
  periodEnd: Date
}

function shiftMinutes(shift: Shift, date: Date): number {
  const start = combineDateAndTime(date, shift.startTime)
  const end = combineDateAndTime(date, shift.endTime)
  return Math.max(0, (end.getTime() - start.getTime()) / 60_000)
}

export function computeProductivity(input: MetricsInput): ProductivityMetrics {
  const { professionalId, shifts, timeOff, appointments, periodStart, periodEnd } = input

  const completed = appointments.filter(
    (appointment) =>
      appointment.professionalId === professionalId &&
      appointment.status === 'completed' &&
      new Date(appointment.start) >= periodStart &&
      new Date(appointment.start) <= periodEnd,
  )

  const busyMinutes = completed.reduce(
    (total, appointment) => total + appointment.durationMinutes,
    0,
  )

  const timeOffKeys = new Set(
    timeOff
      .filter((entry) => entry.professionalId === professionalId)
      .map((entry) => entry.date),
  )

  let availableMinutes = 0
  let cursor = startOfDay(periodStart)
  const lastDay = startOfDay(periodEnd)

  while (cursor <= lastDay) {
    if (!timeOffKeys.has(toDateKey(cursor))) {
      const shift = shifts.find((entry) => entry.weekday === (cursor.getDay() as Weekday))
      if (shift) {
        availableMinutes += shiftMinutes(shift, cursor)
      }
    }
    cursor = addDays(cursor, 1)
  }

  return {
    completedCount: completed.length,
    busyMinutes,
    availableMinutes,
    occupancyRate: availableMinutes === 0 ? 0 : busyMinutes / availableMinutes,
  }
}
