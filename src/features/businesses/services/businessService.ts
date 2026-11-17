import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../../shared/lib/firebase'
import type { Professional } from '../../professionals/types'
import type { Service } from '../../services-catalog/types'
import type { Business } from '../types'

function toBusiness(snapshot: DocumentSnapshot<DocumentData>): Business {
  const data = snapshot.data() ?? {}
  return {
    id: snapshot.id,
    name: data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    active: data.active,
  }
}

export function toService(businessId: string, snapshot: DocumentSnapshot<DocumentData>): Service {
  const data = snapshot.data() ?? {}
  return {
    id: snapshot.id,
    businessId,
    name: data.name,
    durationMinutes: data.durationMinutes,
    price: data.price,
    active: data.active,
  }
}

export function toProfessional(
  businessId: string,
  snapshot: DocumentSnapshot<DocumentData>,
): Professional {
  const data = snapshot.data() ?? {}
  return {
    id: snapshot.id,
    businessId,
    name: data.name,
    phone: data.phone,
    serviceIds: data.serviceIds ?? [],
    shifts: data.shifts ?? [],
    active: data.active,
  }
}

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, 'pt-BR')
}

export async function listBusinesses(): Promise<Business[]> {
  const snapshot = await getDocs(query(collection(db, 'businesses'), where('active', '==', true)))
  return snapshot.docs.map(toBusiness).sort(byName)
}

export async function getBusinessById(businessId: string): Promise<Business | undefined> {
  if (!businessId) {
    return undefined
  }
  try {
    const snapshot = await getDoc(doc(db, 'businesses', businessId))
    return snapshot.exists() ? toBusiness(snapshot) : undefined
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      return undefined
    }
    throw error
  }
}

export async function listServicesForBusiness(businessId: string): Promise<Service[]> {
  if (!businessId) {
    return []
  }
  const snapshot = await getDocs(
    query(collection(db, 'businesses', businessId, 'services'), where('active', '==', true)),
  )
  return snapshot.docs.map((entry) => toService(businessId, entry)).sort(byName)
}

export async function listProfessionalsForBusiness(businessId: string): Promise<Professional[]> {
  if (!businessId) {
    return []
  }
  const snapshot = await getDocs(
    query(collection(db, 'businesses', businessId, 'professionals'), where('active', '==', true)),
  )
  return snapshot.docs.map((entry) => toProfessional(businessId, entry)).sort(byName)
}
