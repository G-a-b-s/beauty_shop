import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../../shared/lib/firebase'
import { toFriendlyError } from '../../../shared/lib/firebaseErrors'
import { getSecondaryAuth } from '../../../shared/lib/secondaryAuth'
import { toProfessional } from '../../businesses/services/businessService'
import type { NewProfessional, Professional, ProfessionalUpdate, Shift } from '../types'

function professionalRef(businessId: string, professionalId: string) {
  return doc(db, 'businesses', businessId, 'professionals', professionalId)
}

export async function listProfessionalsByBusiness(businessId: string): Promise<Professional[]> {
  if (!businessId) {
    return []
  }
  const snapshot = await getDocs(collection(db, 'businesses', businessId, 'professionals'))
  return snapshot.docs
    .map((entry) => toProfessional(businessId, entry))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getProfessionalById(
  businessId: string,
  professionalId: string,
): Promise<Professional | undefined> {
  const snapshot = await getDoc(professionalRef(businessId, professionalId))
  return snapshot.exists() ? toProfessional(businessId, snapshot) : undefined
}

export async function createProfessional(data: NewProfessional): Promise<Professional> {
  const secondaryAuth = getSecondaryAuth()

  let credential
  try {
    credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      data.email.trim(),
      data.password,
    )
  } catch (error) {
    throw toFriendlyError(error)
  }

  const uid = credential.user.uid
  const record = {
    name: data.name,
    phone: data.phone,
    serviceIds: data.serviceIds,
    shifts: data.shifts,
    active: true,
  }

  try {
    const batch = writeBatch(db)
    batch.set(professionalRef(data.businessId, uid), record)
    batch.set(doc(db, 'users', uid), { type: 'professional', businessId: data.businessId })
    await batch.commit()
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined)
    throw toFriendlyError(error)
  } finally {
    await signOut(secondaryAuth)
  }

  return { id: uid, businessId: data.businessId, ...record }
}

export async function updateProfessional(
  businessId: string,
  professionalId: string,
  update: ProfessionalUpdate,
): Promise<void> {
  try {
    await updateDoc(professionalRef(businessId, professionalId), {
      name: update.name,
      phone: update.phone,
      serviceIds: update.serviceIds,
      shifts: update.shifts,
    })
  } catch (error) {
    throw toFriendlyError(error)
  }
}

export async function updateProfessionalShifts(
  businessId: string,
  professionalId: string,
  shifts: Shift[],
): Promise<void> {
  await updateDoc(professionalRef(businessId, professionalId), { shifts })
}


function timeOffCollection(businessId: string, professionalId: string) {
  return collection(professionalRef(businessId, professionalId), 'timeOff')
}

export async function addTimeOff(
  businessId: string,
  professionalId: string,
  date: string,
  reason: string,
): Promise<void> {
  const trimmedReason = reason.trim()
  try {
    await addDoc(
      timeOffCollection(businessId, professionalId),
      trimmedReason === '' ? { date } : { date, reason: trimmedReason },
    )
  } catch (error) {
    throw toFriendlyError(error)
  }
}

export async function removeTimeOff(
  businessId: string,
  professionalId: string,
  timeOffId: string,
): Promise<void> {
  try {
    await deleteDoc(doc(timeOffCollection(businessId, professionalId), timeOffId))
  } catch (error) {
    throw toFriendlyError(error)
  }
}

export async function setProfessionalActive(
  businessId: string,
  professionalId: string,
  active: boolean,
): Promise<void> {
  await updateDoc(professionalRef(businessId, professionalId), { active })
}
