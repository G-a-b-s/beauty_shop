import { useEffect, useState } from 'react'
import type { Professional } from '../../professionals/types'
import type { Service } from '../../services-catalog/types'
import { getBusinessById, listProfessionalsForBusiness, listServicesForBusiness } from '../services/businessService'
import type { Business } from '../types'

export function useBusinessDetails(businessId: string | undefined) {
  const [business, setBusiness] = useState<Business | undefined>(undefined)
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getBusinessById(businessId ?? ''),
      listServicesForBusiness(businessId ?? ''),
      listProfessionalsForBusiness(businessId ?? ''),
    ]).then(([businessResult, servicesResult, professionalsResult]) => {
      setBusiness(businessResult)
      setServices(servicesResult)
      setProfessionals(professionalsResult)
      setLoading(false)
    })
  }, [businessId])

  const notFound = !loading && (!business || !business.active)

  return { business, services, professionals, loading, notFound }
}
