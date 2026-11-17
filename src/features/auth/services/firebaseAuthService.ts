import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, writeBatch } from 'firebase/firestore'
import { auth } from '../../../shared/lib/auth'
import { db } from '../../../shared/lib/firebase'
import { toFriendlyError } from '../../../shared/lib/firebaseErrors'
import type {
  AccountType,
  AuthenticatedAccount,
  LoginData,
  SelfSignUpType,
  SignUpData,
} from '../types'

type Listener = (account: AuthenticatedAccount | null) => void

type UserRecord =
  | { type: 'customer' }
  | { type: 'business' }
  | { type: 'professional'; businessId: string }

const collectionByType: Record<SelfSignUpType, string> = {
  customer: 'customers',
  business: 'businesses',
}

const INCOMPLETE_ACCOUNT_MESSAGE = 'Cadastro incompleto. Entre em contato com o suporte'

const listeners = new Set<Listener>()
let currentAccount: AuthenticatedAccount | null = null
let resolved = false
let signUpInProgress = false
let firebaseUnsubscribe: (() => void) | null = null

function emit(account: AuthenticatedAccount | null): void {
  currentAccount = account
  resolved = true
  for (const listener of listeners) {
    listener(account)
  }
}

async function handleAuthStateChange(user: User | null): Promise<void> {
  if (signUpInProgress) {
    return
  }
  if (!user) {
    emit(null)
    return
  }
  try {
    emit(await fetchAccount(user))
  } catch (error) {
    if (error instanceof Error && error.message === INCOMPLETE_ACCOUNT_MESSAGE) {
      await signOut(auth)
      return
    }
    emit(null)
  }
}

function ensureFirebaseSubscription(): void {
  if (!firebaseUnsubscribe) {
    firebaseUnsubscribe = onAuthStateChanged(auth, (user) => {
      void handleAuthStateChange(user)
    })
  }
}

export function subscribeToAccount(listener: Listener): () => void {
  listeners.add(listener)
  ensureFirebaseSubscription()
  if (resolved) {
    listener(currentAccount)
  }
  return () => {
    listeners.delete(listener)
  }
}

export async function signUp(
  type: SelfSignUpType,
  data: SignUpData,
): Promise<AuthenticatedAccount> {
  signUpInProgress = true
  try {
    let user: User
    try {
      const credential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password)
      user = credential.user
    } catch (error) {
      throw toFriendlyError(error)
    }

    const profile =
      type === 'customer'
        ? { name: data.name, phone: data.phone, cpf: data.taxId }
        : {
            name: data.name,
            phone: data.phone,
            cnpj: data.taxId,
            address: data.address ?? '',
            city: data.city ?? '',
            active: true,
          }

    try {
      const batch = writeBatch(db)
      batch.set(doc(db, 'users', user.uid), { type })
      batch.set(doc(db, collectionByType[type], user.uid), profile)
      await batch.commit()
    } catch (error) {
      await deleteUser(user).catch(() => signOut(auth))
      throw toFriendlyError(error)
    }

    const account: AuthenticatedAccount = {
      uid: user.uid,
      email: user.email ?? data.email.trim(),
      type,
      name: data.name,
    }
    signUpInProgress = false
    emit(account)
    return account
  } finally {
    signUpInProgress = false
  }
}

export async function login(data: LoginData): Promise<AuthenticatedAccount> {
  let user: User
  try {
    const credential = await signInWithEmailAndPassword(auth, data.email.trim(), data.password)
    user = credential.user
  } catch (error) {
    throw toFriendlyError(error)
  }

  try {
    return await fetchAccount(user)
  } catch (error) {
    await signOut(auth)
    throw toFriendlyError(error)
  }
}

export function logout(): Promise<void> {
  return signOut(auth)
}

export async function refreshAccount(): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    return
  }
  emit(await fetchAccount(user))
}

async function fetchAccount(user: User): Promise<AuthenticatedAccount> {
  const userSnap = await getDoc(doc(db, 'users', user.uid))
  if (!userSnap.exists()) {
    throw new Error(INCOMPLETE_ACCOUNT_MESSAGE)
  }
  const userRecord = userSnap.data() as UserRecord
  const type: AccountType = userRecord.type

  const dataRef =
    userRecord.type === 'professional'
      ? doc(db, 'businesses', userRecord.businessId, 'professionals', user.uid)
      : doc(db, collectionByType[userRecord.type], user.uid)

  const dataSnap = await getDoc(dataRef)
  const name = dataSnap.exists() ? (dataSnap.data().name as string) : ''

  return {
    uid: user.uid,
    email: user.email ?? '',
    type,
    name,
    ...(userRecord.type === 'professional' ? { businessId: userRecord.businessId } : {}),
  }
}
