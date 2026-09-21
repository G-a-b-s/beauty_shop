export type AccountType = 'customer' | 'business' | 'professional'

export type AuthenticatedAccount = {
  uid: string
  email: string
  type: AccountType
  name: string
  businessId?: string
}

export type SignUpData = {
  name: string
  phone: string
  taxId: string
  email: string
  password: string
  address?: string
  city?: string
}

export type LoginData = {
  email: string
  password: string
}
