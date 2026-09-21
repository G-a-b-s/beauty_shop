import {
  mockAppointments,
  mockBusinesses,
  mockProfessionals,
  mockServices,
  mockTimeOff,
  seedAppointmentsForCustomer,
} from '../../../shared/lib/mockDb'
import type { Appointment, NewAppointment, Shift, TimeOff } from '../types'

export async function listShiftsForProfessional(professionalId: string): Promise<Shift[]> {
  const professional = mockProfessionals.find((entry) => entry.id === professionalId)
  return professional?.shifts ?? []
}

export async function listTimeOffForProfessional(professionalId: string): Promise<TimeOff[]> {
  return mockTimeOff.filter((entry) => entry.professionalId === professionalId)
}

export async function listAppointmentsForProfessional(
  professionalId: string,
): Promise<Appointment[]> {
  return mockAppointments.filter((appointment) => appointment.professionalId === professionalId)
}

export async function listAppointmentsForCustomer(
  customerId: string,
  customerName: string,
): Promise<Appointment[]> {
  seedAppointmentsForCustomer(customerId, customerName)
  return mockAppointments.filter((appointment) => appointment.customerId === customerId)
}

export async function listAppointmentsForBusiness(businessId: string): Promise<Appointment[]> {
  return mockAppointments.filter((appointment) => appointment.businessId === businessId)
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
): Promise<void> {
  const appointment = mockAppointments.find((entry) => entry.id === appointmentId)
  if (appointment) {
    appointment.status = status
  }
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  const appointment = mockAppointments.find((entry) => entry.id === appointmentId)
  if (appointment) {
    appointment.status = 'cancelled'
  }
}

export async function createAppointment(data: NewAppointment): Promise<Appointment> {
  const business = mockBusinesses.find((entry) => entry.id === data.businessId)
  const professional = mockProfessionals.find((entry) => entry.id === data.professionalId)
  const service = mockServices.find((entry) => entry.id === data.serviceId)

  const appointment: Appointment = {
    id: `appointment-${Date.now()}`,
    businessId: data.businessId,
    customerId: data.customerId,
    professionalId: data.professionalId,
    serviceId: data.serviceId,
    businessName: business?.name ?? '',
    professionalName: professional?.name ?? '',
    customerName: data.customerName,
    serviceName: service?.name ?? '',
    durationMinutes: service?.durationMinutes ?? 0,
    start: data.start.toISOString(),
    end: data.end.toISOString(),
    status: 'scheduled',
  }

  mockAppointments.push(appointment)
  return appointment
}
