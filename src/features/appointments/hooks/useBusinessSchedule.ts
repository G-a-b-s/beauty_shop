import { useEffect, useMemo, useState } from 'react'
import { addDays, addMonths, getMonthGrid, isSameDay, startOfDay, startOfWeek } from '../../../shared/lib/date'
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const visibleDays = useMemo(() => {
    if (view === 'day') return [referenceDate]
    if (view === 'week') {
      const weekStart = startOfWeek(referenceDate)
      return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
    }

    return getMonthGrid(referenceDate)
  }, [view, referenceDate])

  const rangeStart = visibleDays[0].getTime()
  const rangeEnd = addDays(visibleDays[visibleDays.length - 1], 1).getTime()

  useEffect(() => {
    if (!businessId) {
      return
    }
    let ignore = false
    listAppointmentsForBusiness(businessId, new Date(rangeStart), new Date(rangeEnd)).then(
      (result) => {
        if (!ignore) {
          setAppointments(result)
          setLoading(false)
        }
      },
    )
    return () => {
      ignore = true
    }
  }, [businessId, rangeStart, rangeEnd])

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

  async function updateStatus(appointmentId: string, status: AppointmentStatus): Promise<boolean> {
    const appointment = appointments.find((entry) => entry.id === appointmentId)
    if (!appointment) {
      return false
    }
    setUpdatingId(appointmentId)
    setUpdateError(null)
    try {
      await setAppointmentStatus(appointment, status)
      setAppointments(
        await listAppointmentsForBusiness(businessId, new Date(rangeStart), new Date(rangeEnd)),
      )
      return true
    } catch {
      setUpdateError('Não foi possível salvar. Tente novamente')
      return false
    } finally {
      setUpdatingId(null)
    }
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
    updatingId,
    updateError,
  }
}
