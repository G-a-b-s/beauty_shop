import { mockAppointments, mockTimeOff } from '../../../shared/lib/mockDb'
import type { Appointment, TimeOff } from '../../appointments/types'

export async function listAppointmentsForBusiness(businessId: string): Promise<Appointment[]> {
  return mockAppointments.filter((appointment) => appointment.businessId === businessId)
}

export async function listTimeOffForBusiness(professionalIds: string[]): Promise<TimeOff[]> {
  return mockTimeOff.filter((entry) => professionalIds.includes(entry.professionalId))
}
