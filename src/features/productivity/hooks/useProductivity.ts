import { useEffect, useMemo, useState } from 'react'
import { addDays, startOfDay } from '../../../shared/lib/date'
import type { Appointment, TimeOff } from '../../appointments/types'
import { listProfessionalsByBusiness } from '../../professionals/services/professionalService'
import type { Professional } from '../../professionals/types'
import { computeProductivity, type ProductivityMetrics } from '../domain/metrics'
import { listAppointmentsForBusiness, listTimeOffForBusiness } from '../services/productivityService'

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

  useEffect(() => {
    listProfessionalsByBusiness(businessId).then(async (professionalsResult) => {
      const [appointmentsResult, timeOffResult] = await Promise.all([
        listAppointmentsForBusiness(businessId),
        listTimeOffForBusiness(professionalsResult.map((professional) => professional.id)),
      ])

      setProfessionals(professionalsResult)
      setAppointments(appointmentsResult)
      setTimeOff(timeOffResult)
      setLoading(false)
    })
  }, [businessId])

  const metrics = useMemo<ProfessionalMetrics[]>(() => {
    const periodEnd = startOfDay(new Date())
    const periodStart = addDays(periodEnd, -periodDays)

    return professionals
      .map((professional) => ({
        professional,
        ...computeProductivity({
          professionalId: professional.id,
          shifts: professional.shifts,
          timeOff,
          appointments,
          periodStart,
          periodEnd,
        }),
      }))
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
  }, [professionals, appointments, timeOff, periodDays])

  return { metrics, loading, periodDays, setPeriodDays }
}
