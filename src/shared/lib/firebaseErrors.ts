import { FirebaseError } from 'firebase/app'

const errorMessageByCode: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha inválidos',
  'auth/invalid-login-credentials': 'E-mail ou senha inválidos',
  'auth/wrong-password': 'E-mail ou senha inválidos',
  'auth/user-not-found': 'E-mail ou senha inválidos',
  'auth/invalid-email': 'E-mail inválido',
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Tente novamente em alguns minutos',
  'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente novamente',
  'permission-denied': 'Operação não permitida',
}

export function toFriendlyError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    return new Error(errorMessageByCode[error.code] ?? 'Não foi possível concluir a operação')
  }
  return error instanceof Error ? error : new Error('Não foi possível concluir a operação')
}
