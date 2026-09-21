import { useAuth } from '../../auth/hooks/useAuth'

export function useCurrentProfessionalId(): string {
  const { account } = useAuth()
  return account?.type === 'professional' ? account.uid : ''
}
