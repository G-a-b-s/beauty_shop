import { Timestamp } from 'firebase/firestore'

export function toDate(value: Timestamp): Date {
  return value.toDate()
}

export function toTimestamp(value: Date): Timestamp {
  return Timestamp.fromDate(value)
}
