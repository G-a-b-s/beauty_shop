import { useEffect, useMemo, useState } from 'react'
import { cancelAppointment, listAppointmentsForCustomer } from '../services/appointmentService'
import type { Appointment } from '../types'

export function useCustomerAppointments(customerId: string, customerName: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAppointmentsForCustomer(customerId, customerName).then((result) => {
      setAppointments([...result])
      setLoading(false)
    })
  }, [customerId, customerName])

  const { upcoming, history } = useMemo(() => {
    const now = new Date()
    const sorted = [...appointments].sort(
      (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
    )

    return {
      upcoming: sorted
        .filter(
          (appointment) =>
            appointment.status === 'scheduled' && new Date(appointment.start) > now,
        )
        .reverse(),
      history: sorted.filter(
        (appointment) => appointment.status !== 'scheduled' || new Date(appointment.start) <= now,
      ),
    }
  }, [appointments])

  async function cancel(appointmentId: string) {
    await cancelAppointment(appointmentId)
    const result = await listAppointmentsForCustomer(customerId, customerName)
    setAppointments([...result])
  }

  return { upcoming, history, loading, cancel }
}
