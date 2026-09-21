import { mockCustomers, seedCustomer } from '../../../shared/lib/mockDb'
import type { Customer, CustomerProfileUpdate } from '../types'

export async function getCustomerProfile(
  customerId: string,
  fallbackName: string,
  fallbackEmail: string,
): Promise<Customer> {
  return seedCustomer(customerId, fallbackName, fallbackEmail)
}

export async function updateCustomerProfile(
  customerId: string,
  update: CustomerProfileUpdate,
): Promise<Customer | undefined> {
  const customer = mockCustomers.find((entry) => entry.id === customerId)
  if (!customer) {
    return undefined
  }

  customer.name = update.name
  customer.phone = update.phone
  return customer
}
