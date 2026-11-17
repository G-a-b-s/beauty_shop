
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Shift = {
  weekday: Weekday
  startTime: string
  endTime: string
}

export type Professional = {
  id: string
  businessId: string
  name: string
  phone: string
  serviceIds: string[]
  shifts: Shift[]
  active: boolean
}
