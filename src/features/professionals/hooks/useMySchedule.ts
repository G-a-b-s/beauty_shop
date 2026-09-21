import { useEffect, useState } from 'react'
import { toDateKey } from '../../../shared/lib/date'
import type { TimeOff } from '../../appointments/types'
import {
  addTimeOff,
  getProfessionalById,
  listTimeOff,
  removeTimeOff,
  updateProfessionalShifts,
} from '../services/professionalService'
import type { Shift } from '../types'

export function useMySchedule(professionalId: string) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfessionalById(professionalId), listTimeOff(professionalId)]).then(
      ([professional, timeOffResult]) => {
        setShifts(professional?.shifts ?? [])
        setTimeOff(timeOffResult)
        setLoading(false)
      },
    )
  }, [professionalId])

  async function saveShifts(nextShifts: Shift[]) {
    setShifts(nextShifts)
    await updateProfessionalShifts(professionalId, nextShifts)
  }

  async function refreshTimeOff() {
    setTimeOff(await listTimeOff(professionalId))
  }

  async function createTimeOff(date: string, reason: string) {
    await addTimeOff(professionalId, date, reason)
    await refreshTimeOff()
  }

  async function deleteTimeOff(timeOffId: string) {
    await removeTimeOff(timeOffId)
    await refreshTimeOff()
  }

  const todayKey = toDateKey(new Date())
  const upcomingTimeOff = timeOff.filter((entry) => entry.date >= todayKey)

  return { shifts, upcomingTimeOff, loading, saveShifts, createTimeOff, deleteTimeOff, todayKey }
}
