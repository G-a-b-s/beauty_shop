import type { Shift } from '../../shared/lib/mockDb'

export type { Professional, Shift, Weekday } from '../../shared/lib/mockDb'

export type NewProfessional = {
  businessId: string
  name: string
  phone: string
  email: string
  password: string
  serviceIds: string[]
  shifts: Shift[]
}

export type ProfessionalUpdate = {
  name: string
  phone: string
  serviceIds: string[]
  shifts: Shift[]
}
