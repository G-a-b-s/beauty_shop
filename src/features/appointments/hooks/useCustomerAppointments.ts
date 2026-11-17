import { useEffect, useMemo, useState } from 'react'
import { listAppointmentsForCustomer, setAppointmentStatus } from '../services/appointmentService'
import type { Appointment } from '../types'

export function useCustomerAppointments(customerId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    listAppointmentsForCustomer(customerId).then((result) => {
      setAppointments([...result])
      setLoading(false)
    })
  }, [customerId])

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
    const appointment = appointments.find((entry) => entry.id === appointmentId)
    if (!appointment) {
      return
    }
    setError(null)
    setMessage(null)
    try {
      await setAppointmentStatus(appointment, 'cancelled')
      setMessage(`Agendamento de ${appointment.serviceName} cancelado`)
    } catch {
      setError('Não foi possível cancelar. Tente novamente')
    }
    const result = await listAppointmentsForCustomer(customerId)
    setAppointments([...result])
  }

  return { upcoming, history, loading, cancel, error, message }
}
