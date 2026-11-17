import type { AppointmentStatus } from '../types'

export const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  noShow: 'Falta',
}
