import { useEffect, useMemo, useState } from 'react'
import { normalizeText } from '../../../shared/lib/text'
import { listBusinesses } from '../services/businessService'
import type { Business } from '../types'

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    listBusinesses().then((data) => {
      setBusinesses(data)
      setLoading(false)
    })
  }, [])

  const filteredBusinesses = useMemo(() => {
    const activeBusinesses = businesses.filter((business) => business.active)
    const normalizedSearch = normalizeText(searchTerm.trim())

    if (!normalizedSearch) {
      return activeBusinesses
    }

    return activeBusinesses.filter(
      (business) =>
        normalizeText(business.name).includes(normalizedSearch) ||
        normalizeText(business.city).includes(normalizedSearch),
    )
  }, [businesses, searchTerm])

  return { businesses: filteredBusinesses, loading, searchTerm, setSearchTerm }
}
