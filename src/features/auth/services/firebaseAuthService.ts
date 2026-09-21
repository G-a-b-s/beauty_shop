import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth } from '../../../shared/lib/auth'
import { db } from '../../../shared/lib/firebase'
import type { AccountType, AuthenticatedAccount, LoginData, SignUpData } from '../types'

export type SelfSignUpType = 'customer' | 'business'

const collectionByType: Record<SelfSignUpType, string> = {
  customer: 'customers',
  business: 'businesses',
}

const taxIdFieldByType: Record<SelfSignUpType, 'cpf' | 'cnpj'> = {
  customer: 'cpf',
  business: 'cnpj',
}

export async function signUp(
  type: SelfSignUpType,
  data: SignUpData,
): Promise<AuthenticatedAccount> {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password)
  const uid = credential.user.uid

  await setDoc(doc(db, 'users', uid), { type })
  await setDoc(doc(db, collectionByType[type], uid), {
    name: data.name,
    phone: data.phone,
    [taxIdFieldByType[type]]: data.taxId,
    ...(type === 'business'
      ? { address: data.address, city: data.city, active: true }
      : {}),
  })

  return { uid, email: data.email, type, name: data.name }
}

export async function login(data: LoginData): Promise<AuthenticatedAccount> {
  const credential = await signInWithEmailAndPassword(auth, data.email, data.password)
  return fetchAccount(credential.user)
}

export function logout(): Promise<void> {
  return signOut(auth)
}

export async function fetchAccount(user: User): Promise<AuthenticatedAccount> {
  const userSnap = await getDoc(doc(db, 'users', user.uid))
  if (!userSnap.exists()) {
    throw new Error('Conta autenticada, mas sem registro em "users". Cadastro incompleto.')
  }
  const userRecord = userSnap.data() as { type: AccountType; businessId?: string }
  const { type } = userRecord

  const dataRef =
    type === 'professional'
      ? doc(db, 'businesses', userRecord.businessId ?? '', 'professionals', user.uid)
      : doc(db, collectionByType[type], user.uid)

  const dataSnap = await getDoc(dataRef)
  const name = dataSnap.exists() ? (dataSnap.data().name as string) : ''

  return { uid: user.uid, email: user.email ?? '', type, name }
}
