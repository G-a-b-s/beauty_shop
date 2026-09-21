import { useEffect, useState } from 'react'
import { listServicesForBusiness } from '../../businesses/services/businessService'
import type { Service } from '../../services-catalog/types'
import {
  createProfessional,
  getProfessionalById,
  updateProfessional,
} from '../services/professionalService'
import type { NewProfessional, Professional, ProfessionalUpdate } from '../types'

export function useProfessionalForm(businessId: string, professionalId: string | undefined) {
  const [services, setServices] = useState<Service[]>([])
  const [professional, setProfessional] = useState<Professional | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listServicesForBusiness(businessId),
      professionalId ? getProfessionalById(professionalId) : Promise.resolve(undefined),
    ]).then(([servicesResult, professionalResult]) => {
      setServices(servicesResult)
      setProfessional(professionalResult)
      setLoading(false)
    })
  }, [businessId, professionalId])

  async function create(data: Omit<NewProfessional, 'businessId'>) {
    await createProfessional({ ...data, businessId })
  }

  async function update(data: ProfessionalUpdate) {
    if (professionalId) {
      await updateProfessional(professionalId, data)
    }
  }

  return { services, professional, loading, create, update }
}
