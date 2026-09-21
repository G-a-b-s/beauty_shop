export type { Appointment, AppointmentStatus, Shift, TimeOff } from '../../shared/lib/mockDb'

export type NewAppointment = {
  businessId: string
  customerId: string
  customerName: string
  professionalId: string
  serviceId: string
  start: Date
  end: Date
}
