import { useEffect, useState } from 'react'
import {
  listProfessionalsByBusiness,
  setProfessionalActive,
} from '../services/professionalService'
import type { Professional } from '../types'

export function useProfessionals(businessId: string) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listProfessionalsByBusiness(businessId).then((result) => {
      setProfessionals([...result])
      setLoading(false)
    })
  }, [businessId])

  async function toggleActive(professionalId: string, active: boolean) {
    await setProfessionalActive(professionalId, active)
    const result = await listProfessionalsByBusiness(businessId)
    setProfessionals([...result])
  }

  return { professionals, loading, toggleActive }
}
