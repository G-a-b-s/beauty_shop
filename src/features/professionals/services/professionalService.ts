import { mockProfessionals, mockTimeOff } from '../../../shared/lib/mockDb'
import type { TimeOff } from '../../appointments/types'
import { registerProfessionalAccount } from '../../auth/services/mockAuthService'
import type { NewProfessional, Professional, ProfessionalUpdate, Shift } from '../types'

export async function listProfessionalsByBusiness(businessId: string): Promise<Professional[]> {
  return mockProfessionals
    .filter((professional) => professional.businessId === businessId)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getProfessionalById(
  professionalId: string,
): Promise<Professional | undefined> {
  return mockProfessionals.find((professional) => professional.id === professionalId)
}

export async function createProfessional(data: NewProfessional): Promise<Professional> {
  const professional: Professional = {
    id: `professional-${Date.now()}`,
    businessId: data.businessId,
    name: data.name,
    phone: data.phone,
    serviceIds: data.serviceIds,
    shifts: data.shifts,
    active: true,
  }

  mockProfessionals.push(professional)

  registerProfessionalAccount({
    uid: professional.id,
    email: data.email,
    password: data.password,
    name: data.name,
    businessId: data.businessId,
  })

  return professional
}

export async function updateProfessional(
  professionalId: string,
  update: ProfessionalUpdate,
): Promise<Professional | undefined> {
  const professional = mockProfessionals.find((entry) => entry.id === professionalId)
  if (!professional) {
    return undefined
  }

  professional.name = update.name
  professional.phone = update.phone
  professional.serviceIds = update.serviceIds
  professional.shifts = update.shifts

  return professional
}

export async function updateProfessionalShifts(
  professionalId: string,
  shifts: Shift[],
): Promise<void> {
  const professional = mockProfessionals.find((entry) => entry.id === professionalId)
  if (professional) {
    professional.shifts = shifts
  }
}

export async function listTimeOff(professionalId: string): Promise<TimeOff[]> {
  return mockTimeOff
    .filter((entry) => entry.professionalId === professionalId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function addTimeOff(
  professionalId: string,
  date: string,
  reason: string,
): Promise<void> {
  mockTimeOff.push({
    id: `time-off-${Date.now()}`,
    professionalId,
    date,
    reason: reason.trim() === '' ? undefined : reason.trim(),
  })
}

export async function removeTimeOff(timeOffId: string): Promise<void> {
  const index = mockTimeOff.findIndex((entry) => entry.id === timeOffId)
  if (index >= 0) {
    mockTimeOff.splice(index, 1)
  }
}

export async function setProfessionalActive(
  professionalId: string,
  active: boolean,
): Promise<void> {
  const professional = mockProfessionals.find((entry) => entry.id === professionalId)
  if (professional) {
    professional.active = active
  }
}
