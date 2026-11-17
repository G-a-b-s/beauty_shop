export type { TimeOff } from '../../shared/types/timeOff'
export type { Appointment, AppointmentStatus } from '../../shared/types/appointment'
export type { Shift } from '../../shared/types/professional'

export type NewAppointment = {
  businessId: string
  customerId: string
  customerName: string
  professionalId: string
  serviceId: string
  start: Date
  end: Date
}
