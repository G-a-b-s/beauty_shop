import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, isSameDay, startOfDay, startOfWeek } from '../../../shared/lib/date'
import {
  listAppointmentsForBusiness,
  setAppointmentStatus,
} from '../services/appointmentService'
import type { Appointment, AppointmentStatus } from '../types'

import type { ScheduleViewMode } from '../../../shared/ui/ScheduleView'

export function useBusinessSchedule(businessId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ScheduleViewMode>('day')
  const [referenceDate, setReferenceDate] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    listAppointmentsForBusiness(businessId).then((result) => {
      setAppointments([...result])
      setLoading(false)
    })
  }, [businessId])

  const visibleDays = useMemo(() => {
    if (view === 'day') return [referenceDate]
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
      map.set(
        day.toDateString(),
        appointments
          .filter((appointment) => isSameDay(new Date(appointment.start), day))
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      )
    }

    return map
  }, [appointments, visibleDays])

  async function updateStatus(appointmentId: string, status: AppointmentStatus) {
    await setAppointmentStatus(appointmentId, status)
    const result = await listAppointmentsForBusiness(businessId)
    setAppointments([...result])
  }

  function goToPrevious() {
    setReferenceDate((current) =>
      view === 'day' ? addDays(current, -1) : view === 'week' ? addDays(current, -7) : addMonths(current, -1),
    )
  }

  function goToNext() {
    setReferenceDate((current) =>
      view === 'day' ? addDays(current, 1) : view === 'week' ? addDays(current, 7) : addMonths(current, 1),
    )
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
    updateStatus,
  }
}
