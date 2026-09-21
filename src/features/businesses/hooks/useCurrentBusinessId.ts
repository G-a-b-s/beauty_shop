import { useAuth } from '../../auth/hooks/useAuth'

export function useCurrentBusinessId(): string {
  const { account } = useAuth()

  if (!account) {
    return ''
  }

  return account.type === 'business' ? account.uid : (account.businessId ?? '')
}
