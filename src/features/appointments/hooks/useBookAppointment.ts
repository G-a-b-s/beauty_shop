import { useEffect, useMemo, useState } from 'react'
import { addDays, startOfDay } from '../../../shared/lib/date'
import {
  listProfessionalsForBusiness,
  listServicesForBusiness,
} from '../../businesses/services/businessService'
import type { Professional } from '../../professionals/types'
import type { Service } from '../../services-catalog/types'
import { getAvailableSlots, type TimeSlot } from '../domain/availability'
import {
  createAppointment,
  listAppointmentsForProfessional,
  listShiftsForProfessional,
  listTimeOffForProfessional,
} from '../services/appointmentService'
import type { Appointment, Shift, TimeOff } from '../types'

const DAYS_AHEAD = 14

export function useBookAppointment(
  businessId: string | undefined,
  customerId: string,
  customerName: string,
) {
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  const [shifts, setShifts] = useState<Shift[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    Promise.all([
      listServicesForBusiness(businessId ?? ''),
      listProfessionalsForBusiness(businessId ?? ''),
    ]).then(([servicesResult, professionalsResult]) => {
      setServices(servicesResult)
      setProfessionals(professionalsResult)
      setLoading(false)
    })
  }, [businessId])

  useEffect(() => {
    if (!selectedProfessionalId) {
      return
    }

    Promise.all([
      listShiftsForProfessional(selectedProfessionalId),
      listTimeOffForProfessional(selectedProfessionalId),
      listAppointmentsForProfessional(selectedProfessionalId),
    ]).then(([shiftsResult, timeOffResult, appointmentsResult]) => {
      setShifts(shiftsResult)
      setTimeOff(timeOffResult)
      setAppointments(appointmentsResult)
    })
  }, [selectedProfessionalId])

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null
  const selectedProfessional =
    professionals.find((professional) => professional.id === selectedProfessionalId) ?? null

  const availableProfessionals = useMemo(() => {
    if (!selectedServiceId) {
      return []
    }
    return professionals.filter((professional) =>
      professional.serviceIds.includes(selectedServiceId),
    )
  }, [professionals, selectedServiceId])

  const availableDates = useMemo(() => {
    const today = startOfDay(new Date())
    return Array.from({ length: DAYS_AHEAD }, (_, index) => addDays(today, index))
  }, [])

  const availableSlots = useMemo(() => {
    if (!selectedProfessionalId || !selectedService || !selectedDate) {
      return []
    }

    return getAvailableSlots({
      date: selectedDate,
      professionalId: selectedProfessionalId,
      durationMinutes: selectedService.durationMinutes,
      shifts,
      timeOff,
      appointments,
      now: new Date(),
    })
  }, [selectedProfessionalId, selectedService, selectedDate, shifts, timeOff, appointments])

  function selectService(serviceId: string) {
    setSelectedServiceId(serviceId)
    setSelectedProfessionalId(null)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function selectProfessional(professionalId: string) {
    setSelectedProfessionalId(professionalId)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function selectDate(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  async function confirm(): Promise<boolean> {
    if (!businessId || !selectedServiceId || !selectedProfessionalId || !selectedSlot) {
      return false
    }

    await createAppointment({
      businessId,
      customerId,
      customerName,
      professionalId: selectedProfessionalId,
      serviceId: selectedServiceId,
      start: selectedSlot.start,
      end: selectedSlot.end,
    })

    return true
  }

  return {
    loading,
    services,
    availableProfessionals,
    availableDates,
    availableSlots,
    selectedService,
    selectedProfessional,
    selectedDate,
    selectedSlot,
    selectService,
    selectProfessional,
    selectDate,
    setSelectedSlot,
    confirm,
  }
}
