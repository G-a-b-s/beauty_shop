import { useEffect, useState } from 'react'
import {
  listProfessionalsByBusiness,
  setProfessionalActive,
} from '../services/professionalService'
import type { Professional } from '../types'

export function useProfessionals(businessId: string) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) {
      return
    }
    listProfessionalsByBusiness(businessId).then((result) => {
      setProfessionals([...result])
      setLoading(false)
    })
  }, [businessId])

  async function toggleActive(professionalId: string, active: boolean): Promise<boolean> {
    setError(null)
    try {
      await setProfessionalActive(businessId, professionalId, active)
    } catch {
      setError('Não foi possível salvar a alteração. Tente novamente')
      return false
    }
    const result = await listProfessionalsByBusiness(businessId)
    setProfessionals([...result])
    return true
  }

  return { professionals, loading, toggleActive, error }
}
