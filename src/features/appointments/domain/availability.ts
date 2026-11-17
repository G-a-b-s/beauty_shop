import { addMinutes, combineDateAndTime, toDateKey } from '../../../shared/lib/date'
import type { TimeOff } from '../../../shared/types/timeOff'
import type { Shift, Weekday } from '../../../shared/types/professional'
import { hasConflict, type TimeRange } from './conflict'

export type TimeSlot = TimeRange

type AvailabilityInput = {
  date: Date
  professionalId: string
  durationMinutes: number
  shifts: Shift[]
  timeOff: TimeOff[]
  busySlots: TimeRange[]
  now: Date
}

export function getAvailableSlots(input: AvailabilityInput): TimeSlot[] {
  const { date, professionalId, durationMinutes, shifts, timeOff, busySlots, now } = input

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

  const slots: TimeSlot[] = []
  let slotStart = shiftStart

  while (addMinutes(slotStart, durationMinutes) <= shiftEnd) {
    const slot = { start: slotStart, end: addMinutes(slotStart, durationMinutes) }
    const isInThePast = slot.start <= now

    if (!isInThePast && !hasConflict(slot, busySlots)) {
      slots.push(slot)
    }

    slotStart = slot.end
  }

  return slots
}
