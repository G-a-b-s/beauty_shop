import { useEffect, useMemo, useState } from 'react'
import { isSameDay, toDateKey } from '../../../shared/lib/date'
import {
  listAppointmentsForBusiness,
  setAppointmentStatus,
} from '../services/appointmentService'
import type { Appointment, AppointmentStatus } from '../types'

export function useBusinessSchedule(businessId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()))

  useEffect(() => {
    listAppointmentsForBusiness(businessId).then((result) => {
      setAppointments([...result])
      setLoading(false)
    })
  }, [businessId])

  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedDateKey.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [selectedDateKey])

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => isSameDay(new Date(appointment.start), selectedDate))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [appointments, selectedDate],
  )

  async function updateStatus(appointmentId: string, status: AppointmentStatus) {
    await setAppointmentStatus(appointmentId, status)
    const result = await listAppointmentsForBusiness(businessId)
    setAppointments([...result])
  }

  return { dayAppointments, loading, selectedDateKey, setSelectedDateKey, updateStatus }
}
