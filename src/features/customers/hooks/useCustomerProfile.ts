import { useEffect, useState } from 'react'
import { getCustomerProfile, updateCustomerProfile } from '../services/customerService'
import type { Customer } from '../types'

export function useCustomerProfile(customerId: string, accountName: string, accountEmail: string) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomerProfile(customerId, accountName, accountEmail).then((result) => {
      setCustomer({ ...result })
      setLoading(false)
    })
  }, [customerId, accountName, accountEmail])

  async function save(name: string, phone: string) {
    const updated = await updateCustomerProfile(customerId, { name, phone })
    if (updated) {
      setCustomer({ ...updated })
    }
  }

  return { customer, loading, save }
}
