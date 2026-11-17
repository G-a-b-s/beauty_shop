import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../shared/lib/firebase'
import type { Customer, CustomerProfileUpdate } from '../types'

export async function getCustomerProfile(customerId: string): Promise<Customer | undefined> {
  const snapshot = await getDoc(doc(db, 'customers', customerId))
  if (!snapshot.exists()) {
    return undefined
  }
  const data = snapshot.data()
  return {
    id: snapshot.id,
    name: data.name,
    phone: data.phone,
    cpf: data.cpf,
  }
}

export async function updateCustomerProfile(
  customerId: string,
  update: CustomerProfileUpdate,
): Promise<void> {
  await updateDoc(doc(db, 'customers', customerId), {
    name: update.name,
    phone: update.phone,
  })
}
