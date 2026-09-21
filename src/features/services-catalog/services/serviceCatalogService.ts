import { mockServices } from '../../../shared/lib/mockDb'
import type { Service, ServiceDraft } from '../types'

export async function listServicesByBusiness(businessId: string): Promise<Service[]> {
  return mockServices
    .filter((service) => service.businessId === businessId)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function createService(businessId: string, draft: ServiceDraft): Promise<Service> {
  const service: Service = {
    id: `service-${Date.now()}`,
    businessId,
    name: draft.name,
    durationMinutes: draft.durationMinutes,
    price: draft.price,
    active: true,
  }

  mockServices.push(service)
  return service
}

export async function updateService(
  serviceId: string,
  draft: ServiceDraft,
): Promise<Service | undefined> {
  const service = mockServices.find((entry) => entry.id === serviceId)
  if (!service) {
    return undefined
  }

  service.name = draft.name
  service.durationMinutes = draft.durationMinutes
  service.price = draft.price
  return service
}

export async function setServiceActive(serviceId: string, active: boolean): Promise<void> {
  const service = mockServices.find((entry) => entry.id === serviceId)
  if (service) {
    service.active = active
  }
}
