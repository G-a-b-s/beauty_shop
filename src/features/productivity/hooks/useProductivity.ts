import { useEffect, useMemo, useState } from 'react'
import { addDays, startOfDay } from '../../../shared/lib/date'
import {
  listAppointmentsForBusiness,
  listTimeOffForProfessional,
} from '../../appointments/services/appointmentService'
import type { Appointment, TimeOff } from '../../appointments/types'
import { listProfessionalsByBusiness } from '../../professionals/services/professionalService'
import type { Professional } from '../../professionals/types'
import { computeProductivity, type ProductivityMetrics } from '../domain/metrics'

export type PeriodOption = 7 | 30

export type ProfessionalMetrics = ProductivityMetrics & {
  professional: Professional
}

export function useProductivity(businessId: string) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState<PeriodOption>(30)
  const [error, setError] = useState<string | null>(null)

  const periodEnd = startOfDay(new Date()).getTime()
  const periodStart = addDays(new Date(periodEnd), -periodDays).getTime()

  useEffect(() => {
    if (!businessId) {
      return
    }
    let ignore = false

    async function load() {
      const professionalsResult = await listProfessionalsByBusiness(businessId)
      const [appointmentsResult, timeOffResult] = await Promise.all([
        listAppointmentsForBusiness(
          businessId,
          new Date(periodStart),
          addDays(new Date(periodEnd), 1),
          'completed',
        ),
        Promise.all(
          professionalsResult.map((professional) =>
            listTimeOffForProfessional(businessId, professional.id),
          ),
        ).then((lists) => lists.flat()),
      ])

      if (!ignore) {
        setError(null)
        setProfessionals(professionalsResult)
        setAppointments(appointmentsResult)
        setTimeOff(timeOffResult)
        setLoading(false)
      }
    }

    load().catch((loadError) => {
      console.error(loadError)
      if (!ignore) {
        setError('Não foi possível carregar a produtividade')
        setLoading(false)
      }
    })
    return () => {
      ignore = true
    }
  }, [businessId, periodStart, periodEnd])

  const metrics = useMemo<ProfessionalMetrics[]>(
    () =>
      professionals
        .map((professional) => ({
          professional,
          ...computeProductivity({
            professionalId: professional.id,
            shifts: professional.shifts,
            timeOff,
            appointments,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
          }),
        }))
        .sort((a, b) => b.occupancyRate - a.occupancyRate),
    [professionals, appointments, timeOff, periodStart, periodEnd],
  )

  return { metrics, loading, error, periodDays, setPeriodDays }
}
