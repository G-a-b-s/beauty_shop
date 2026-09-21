import { useEffect, useState } from 'react'
import {
  login,
  logout,
  signUp,
  subscribeToAccount,
  type SelfSignUpType,
} from '../services/mockAuthService'
import type { AuthenticatedAccount, LoginData, SignUpData } from '../types'

type Status = 'loading' | 'signedOut' | 'signedIn'

export function useAuth() {
  const [account, setAccount] = useState<AuthenticatedAccount | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeToAccount((nextAccount) => {
      setAccount(nextAccount)
      setStatus(nextAccount ? 'signedIn' : 'signedOut')
    })
  }, [])

  async function createAccount(type: SelfSignUpType, data: SignUpData) {
    setError(null)
    try {
      await signUp(type, data)
    } catch (signUpError) {
      setError((signUpError as Error).message)
      throw signUpError
    }
  }

  async function signIn(data: LoginData) {
    setError(null)
    try {
      await login(data)
    } catch (loginError) {
      setError((loginError as Error).message)
      throw loginError
    }
  }

  async function signOutAccount() {
    await logout()
  }

  return { account, status, error, createAccount, signIn, signOutAccount }
}
