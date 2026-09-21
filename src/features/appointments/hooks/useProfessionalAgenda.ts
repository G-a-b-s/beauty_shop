import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, isSameDay, startOfDay, startOfWeek } from '../../../shared/lib/date'
import { listAppointmentsForProfessional } from '../services/appointmentService'
import type { Appointment } from '../types'

export type AgendaView = 'day' | 'week' | 'month'

export function useProfessionalAgenda(professionalId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<AgendaView>('day')
  const [referenceDate, setReferenceDate] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    listAppointmentsForProfessional(professionalId).then((result) => {
      setAppointments([...result])
      setLoading(false)
    })
  }, [professionalId])

  const visibleDays = useMemo(() => {
    if (view === 'day') {
      return [referenceDate]
    }
    if (view === 'week') {
      const weekStart = startOfWeek(referenceDate)
      return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
    }

    const monthStart = addMonths(referenceDate, 0)
    const gridStart = startOfWeek(monthStart)
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  }, [view, referenceDate])

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
