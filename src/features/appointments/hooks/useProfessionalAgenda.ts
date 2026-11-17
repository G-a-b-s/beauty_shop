import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, getMonthGrid, isSameDay, startOfDay, startOfWeek } from '../../../shared/lib/date'
import type { ScheduleViewMode } from '../../../shared/ui/ScheduleView'
import { listAppointmentsForProfessional } from '../services/appointmentService'
import type { Appointment } from '../types'

export function useProfessionalAgenda(businessId: string, professionalId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ScheduleViewMode>('day')
  const [referenceDate, setReferenceDate] = useState(() => startOfDay(new Date()))

  const visibleDays = useMemo(() => {
    if (view === 'day') {
      return [referenceDate]
    }
    if (view === 'week') {
      const weekStart = startOfWeek(referenceDate)
      return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
    }

    return getMonthGrid(referenceDate)
  }, [view, referenceDate])

  const rangeStart = visibleDays[0].getTime()
  const rangeEnd = addDays(visibleDays[visibleDays.length - 1], 1).getTime()

  useEffect(() => {
    if (!businessId || !professionalId) {
      return
    }
    let ignore = false
    listAppointmentsForProfessional(
      businessId,
      professionalId,
      new Date(rangeStart),
      new Date(rangeEnd),
    ).then((result) => {
      if (!ignore) {
        setAppointments(result)
        setLoading(false)
      }
    })
    return () => {
      ignore = true
    }
  }, [businessId, professionalId, rangeStart, rangeEnd])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()

    for (const day of visibleDays) {
      const key = day.toDateString()
      map.set(
        key,
        appointments
          .filter((appointment) => isSameDay(new Date(appointment.start), day))
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      )
    }

    return map
  }, [appointments, visibleDays])

  function goToPrevious() {
    if (view === 'day') {
      setReferenceDate((current) => addDays(current, -1))
    } else if (view === 'week') {
      setReferenceDate((current) => addDays(current, -7))
    } else {
      setReferenceDate((current) => addMonths(current, -1))
    }
  }

  function goToNext() {
    if (view === 'day') {
      setReferenceDate((current) => addDays(current, 1))
    } else if (view === 'week') {
      setReferenceDate((current) => addDays(current, 7))
    } else {
      setReferenceDate((current) => addMonths(current, 1))
    }
  }

  function openDay(date: Date) {
    setReferenceDate(startOfDay(date))
    setView('day')
  }

  return {
    loading,
    view,
    setView,
    referenceDate,
    visibleDays,
    appointmentsByDay,
    goToPrevious,
    goToNext,
    openDay,
  }
}
