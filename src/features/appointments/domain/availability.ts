import { addMinutes, combineDateAndTime, isSameDay, toDateKey } from '../../../shared/lib/date'
import type { Appointment, Shift, TimeOff, Weekday } from '../../../shared/lib/mockDb'

export type TimeSlot = {
  start: Date
  end: Date
}

type AvailabilityInput = {
  date: Date
  professionalId: string
  durationMinutes: number
  shifts: Shift[]
  timeOff: TimeOff[]
  appointments: Appointment[]
  now: Date
}

export function getAvailableSlots(input: AvailabilityInput): TimeSlot[] {
  const { date, professionalId, durationMinutes, shifts, timeOff, appointments, now } = input

  const isDayOff = timeOff.some(
    (entry) => entry.professionalId === professionalId && entry.date === toDateKey(date),
  )
  if (isDayOff) {
    return []
  }

  const shift = shifts.find((entry) => entry.weekday === (date.getDay() as Weekday))
  if (!shift) {
    return []
  }

  const shiftStart = combineDateAndTime(date, shift.startTime)
  const shiftEnd = combineDateAndTime(date, shift.endTime)

  const blockingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.professionalId === professionalId && appointment.status === 'scheduled',
    )
    .map((appointment) => ({
      start: new Date(appointment.start),
      end: new Date(appointment.end),
    }))
    .filter((appointment) => isSameDay(appointment.start, date))

  const slots: TimeSlot[] = []
  let slotStart = shiftStart

  while (addMinutes(slotStart, durationMinutes) <= shiftEnd) {
    const slotEnd = addMinutes(slotStart, durationMinutes)

    const overlapsAppointment = blockingAppointments.some(
      (appointment) => slotStart < appointment.end && appointment.start < slotEnd,
    )
    const isInThePast = slotStart <= now

    if (!overlapsAppointment && !isInThePast) {
      slots.push({ start: slotStart, end: slotEnd })
    }

    slotStart = addMinutes(slotStart, durationMinutes)
  }

  return slots
}
