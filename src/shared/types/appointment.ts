export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'noShow'

export type Appointment = {
  id: string
  businessId: string
  customerId: string
  professionalId: string
  serviceId: string
  businessName: string
  professionalName: string
  customerName: string
  serviceName: string
  durationMinutes: number
  start: string
  end: string
  status: AppointmentStatus
}
