import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../../../shared/lib/firebase'
import { toFriendlyError } from '../../../shared/lib/firebaseErrors'
import { toService } from '../../businesses/services/businessService'
import type { Service, ServiceDraft } from '../types'

function servicesCollection(businessId: string) {
  return collection(db, 'businesses', businessId, 'services')
}

function serviceRef(businessId: string, serviceId: string) {
  return doc(db, 'businesses', businessId, 'services', serviceId)
}

export async function listServicesByBusiness(businessId: string): Promise<Service[]> {
  if (!businessId) {
    return []
  }
  const snapshot = await getDocs(servicesCollection(businessId))
  return snapshot.docs
    .map((entry) => toService(businessId, entry))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function createService(businessId: string, draft: ServiceDraft): Promise<Service> {
  const record = {
    name: draft.name,
    durationMinutes: draft.durationMinutes,
    price: draft.price,
    active: true,
  }
  try {
    const created = await addDoc(servicesCollection(businessId), record)
    return { id: created.id, businessId, ...record }
  } catch (error) {
    throw toFriendlyError(error)
  }
}

export async function updateService(
  businessId: string,
  serviceId: string,
  draft: ServiceDraft,
): Promise<void> {
  try {
    await updateDoc(serviceRef(businessId, serviceId), {
      name: draft.name,
      durationMinutes: draft.durationMinutes,
      price: draft.price,
    })
  } catch (error) {
    throw toFriendlyError(error)
  }
}

export async function setServiceActive(
  businessId: string,
  serviceId: string,
  active: boolean,
): Promise<void> {
  await updateDoc(serviceRef(businessId, serviceId), { active })
}
