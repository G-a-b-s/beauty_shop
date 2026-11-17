import { useEffect, useState } from 'react'
import {
  createService,
  listServicesByBusiness,
  setServiceActive,
  updateService,
} from '../services/serviceCatalogService'
import type { Service, ServiceDraft } from '../types'

export function useServiceCatalog(businessId: string) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) {
      return
    }
    listServicesByBusiness(businessId).then((result) => {
      setServices([...result])
      setLoading(false)
    })
  }, [businessId])

  async function refresh() {
    const result = await listServicesByBusiness(businessId)
    setServices([...result])
  }

  async function create(draft: ServiceDraft) {
    await createService(businessId, draft)
    await refresh()
  }

  async function update(serviceId: string, draft: ServiceDraft) {
    await updateService(businessId, serviceId, draft)
    await refresh()
  }

  async function toggleActive(serviceId: string, active: boolean): Promise<boolean> {
    setError(null)
    try {
      await setServiceActive(businessId, serviceId, active)
    } catch {
      setError('Não foi possível salvar a alteração. Tente novamente')
      return false
    }
    await refresh()
    return true
  }

  return { services, loading, create, update, toggleActive, error }
}
