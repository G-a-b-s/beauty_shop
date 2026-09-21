import { mockBusinesses, mockProfessionals, mockServices } from '../../../shared/lib/mockDb'
import type { Professional } from '../../professionals/types'
import type { Service } from '../../services-catalog/types'
import type { Business } from '../types'

export async function listBusinesses(): Promise<Business[]> {
  return mockBusinesses
}

export async function getBusinessById(businessId: string): Promise<Business | undefined> {
  return mockBusinesses.find((business) => business.id === businessId)
}

export async function listServicesForBusiness(businessId: string): Promise<Service[]> {
  return mockServices.filter((service) => service.businessId === businessId && service.active)
}

export async function listProfessionalsForBusiness(businessId: string): Promise<Professional[]> {
  return mockProfessionals.filter(
    (professional) => professional.businessId === businessId && professional.active,
  )
}
