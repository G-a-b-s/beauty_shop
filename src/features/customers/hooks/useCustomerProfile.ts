import { useEffect, useState } from 'react'
import { refreshAccount } from '../../auth/services/firebaseAuthService'
import { getCustomerProfile, updateCustomerProfile } from '../services/customerService'
import type { Customer } from '../types'

export function useCustomerProfile(customerId: string) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customerId) {
      return
    }
    getCustomerProfile(customerId).then((result) => {
      setCustomer(result ?? null)
      setLoading(false)
    })
  }, [customerId])

  async function save(name: string, phone: string) {
    await updateCustomerProfile(customerId, { name, phone })
    setCustomer((current) => (current ? { ...current, name, phone } : current))
    await refreshAccount()
  }

  return { customer, loading, save }
}
