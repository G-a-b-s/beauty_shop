import { useEffect, useState } from 'react'
import { toDateKey } from '../../../shared/lib/date'
import { listTimeOffForProfessional } from '../../appointments/services/appointmentService'
import type { TimeOff } from '../../appointments/types'
import {
  addTimeOff,
  getProfessionalById,
  removeTimeOff,
  updateProfessionalShifts,
} from '../services/professionalService'
import type { Shift } from '../types'

export function useMySchedule(businessId: string, professionalId: string) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId || !professionalId) {
      return
    }
    Promise.all([
      getProfessionalById(businessId, professionalId),
      listTimeOffForProfessional(businessId, professionalId),
    ]).then(([professional, timeOffResult]) => {
      setShifts(professional?.shifts ?? [])
      setTimeOff(timeOffResult)
      setLoading(false)
    })
  }, [businessId, professionalId])

  async function saveShifts(nextShifts: Shift[]) {
    const previous = shifts
    setShifts(nextShifts)
    setError(null)
    setMessage(null)
    try {
      await updateProfessionalShifts(businessId, professionalId, nextShifts)
      setMessage('Jornada salva')
    } catch {
      setShifts(previous)
      setError('Não foi possível salvar a jornada. Tente novamente')
    }
  }

  async function refreshTimeOff() {
    setTimeOff(await listTimeOffForProfessional(businessId, professionalId))
  }

  async function createTimeOff(date: string, reason: string): Promise<boolean> {
    setError(null)
    setMessage(null)
    try {
      await addTimeOff(businessId, professionalId, date, reason)
      await refreshTimeOff()
      setMessage('Folga cadastrada')
      return true
    } catch (createError) {
      setError((createError as Error).message)
      return false
    }
  }

  async function deleteTimeOff(timeOffId: string) {
    setError(null)
    setMessage(null)
    try {
      await removeTimeOff(businessId, professionalId, timeOffId)
      await refreshTimeOff()
      setMessage('Folga removida')
    } catch (deleteError) {
      setError((deleteError as Error).message)
    }
  }

  const todayKey = toDateKey(new Date())
  const upcomingTimeOff = timeOff
    .filter((entry) => entry.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    shifts,
    upcomingTimeOff,
    loading,
    error,
    message,
    saveShifts,
    createTimeOff,
    deleteTimeOff,
    todayKey,
  }
}
