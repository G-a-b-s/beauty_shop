import {
  mockAccounts,
  mockBusinesses,
  mockCustomers,
  type MockAccount,
} from '../../../shared/lib/mockDb'
import type { AuthenticatedAccount, LoginData, SignUpData } from '../types'

export type SelfSignUpType = 'customer' | 'business'

const SESSION_KEY = 'beauty-shop.mock-session'

type Listener = (account: AuthenticatedAccount | null) => void

const listeners = new Set<Listener>()
let currentAccount: AuthenticatedAccount | null = null

function toAuthenticatedAccount(account: MockAccount): AuthenticatedAccount {
  return {
    uid: account.uid,
    email: account.email,
    type: account.type,
    name: account.name,
    businessId: account.businessId,
  }
}

function readStoredUid(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function storeUid(uid: string | null): void {
  try {
    if (uid) {
      window.localStorage.setItem(SESSION_KEY, uid)
    } else {
      window.localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    return
  }
}

function setCurrentAccount(account: AuthenticatedAccount | null): void {
  currentAccount = account
  storeUid(account?.uid ?? null)
  for (const listener of listeners) {
    listener(account)
  }
}

function restoreSession(): void {
  const uid = readStoredUid()
  const stored = uid ? mockAccounts.find((account) => account.uid === uid) : undefined
  currentAccount = stored ? toAuthenticatedAccount(stored) : null
}

restoreSession()

export function subscribeToAccount(listener: Listener): () => void {
  listeners.add(listener)
  listener(currentAccount)
  return () => {
    listeners.delete(listener)
  }
}

export async function login(data: LoginData): Promise<AuthenticatedAccount> {
  const account = mockAccounts.find(
    (entry) => entry.email.toLowerCase() === data.email.trim().toLowerCase(),
  )

  if (!account || account.password !== data.password) {
    throw new Error('E-mail ou senha inválidos')
  }

  const authenticated = toAuthenticatedAccount(account)
  setCurrentAccount(authenticated)
  return authenticated
}

export async function signUp(
  type: SelfSignUpType,
  data: SignUpData,
): Promise<AuthenticatedAccount> {
  const emailTaken = mockAccounts.some(
    (entry) => entry.email.toLowerCase() === data.email.trim().toLowerCase(),
  )
  if (emailTaken) {
    throw new Error('Já existe uma conta com esse e-mail')
  }

  const uid = `${type}-${Date.now()}`

  mockAccounts.push({
    uid,
    email: data.email.trim(),
    password: data.password,
    type,
    name: data.name,
  })

  if (type === 'customer') {
    mockCustomers.push({
      id: uid,
      name: data.name,
      email: data.email.trim(),
      phone: data.phone,
      cpf: data.taxId,
    })
  } else {
    mockBusinesses.push({
      id: uid,
      name: data.name,
      phone: data.phone,
      address: data.address ?? '',
      city: data.city ?? '',
      active: true,
    })
  }

  const authenticated = toAuthenticatedAccount(mockAccounts[mockAccounts.length - 1])
  setCurrentAccount(authenticated)
  return authenticated
}

export async function logout(): Promise<void> {
  setCurrentAccount(null)
}

export function registerProfessionalAccount(params: {
  uid: string
  email: string
  password: string
  name: string
  businessId: string
}): void {
  mockAccounts.push({
    uid: params.uid,
    email: params.email.trim(),
    password: params.password,
    type: 'professional',
    name: params.name,
    businessId: params.businessId,
  })
}
