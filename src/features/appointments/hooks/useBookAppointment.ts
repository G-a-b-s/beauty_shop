import { FirebaseError } from 'firebase/app'
import { useEffect, useMemo, useState } from 'react'
import { toFriendlyError } from '../../../shared/lib/firebaseErrors'
import {
  addDays,
  addMonths,
  getMonthGrid,
  isSameMonth,
  startOfDay,
  startOfMonth,
  toDateKey,
} from '../../../shared/lib/date'
import {
  listProfessionalsForBusiness,
  listServicesForBusiness,
} from '../../businesses/services/businessService'
import type { Professional } from '../../professionals/types'
import type { Service } from '../../services-catalog/types'
import { getAvailableSlots, type TimeSlot } from '../domain/availability'
import type { TimeRange } from '../domain/conflict'
import {
  createAppointment,
  listBusySlotsForProfessional,
  listShiftsForProfessional,
  listTimeOffForProfessional,
} from '../services/appointmentService'
import type { Shift, TimeOff } from '../types'

const BOOKING_WINDOW_DAYS = 60

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
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))

  const [shifts, setShifts] = useState<Shift[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [busySlots, setBusySlots] = useState<TimeRange[]>([])
  const [scheduleLoadedFor, setScheduleLoadedFor] = useState<string | null>(null)

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

  const [scheduleVersion, setScheduleVersion] = useState(0)

  useEffect(() => {
    if (!businessId || !selectedProfessionalId) {
      return
    }

    Promise.all([
      listShiftsForProfessional(businessId, selectedProfessionalId),
      listTimeOffForProfessional(businessId, selectedProfessionalId),
      listBusySlotsForProfessional(businessId, selectedProfessionalId),
    ]).then(([shiftsResult, timeOffResult, busySlotsResult]) => {
      setShifts(shiftsResult)
      setTimeOff(timeOffResult)
      setBusySlots(busySlotsResult)
      setScheduleLoadedFor(selectedProfessionalId)
    })
  }, [businessId, selectedProfessionalId, scheduleVersion])

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

  const firstBookableDay = startOfDay(new Date())
  const lastBookableDay = addDays(firstBookableDay, BOOKING_WINDOW_DAYS - 1)
  const scheduleReady =
    selectedProfessionalId !== null && scheduleLoadedFor === selectedProfessionalId

  function slotsFor(date: Date): TimeSlot[] {
    if (!scheduleReady || !selectedProfessionalId || !selectedService) {
      return []
    }
    return getAvailableSlots({
      date,
      professionalId: selectedProfessionalId,
      durationMinutes: selectedService.durationMinutes,
      shifts,
      timeOff,
      busySlots,
      now: new Date(),
    })
  }

  const bookableDays = new Set(
    getMonthGrid(visibleMonth)
      .filter((day) => isSameMonth(day, visibleMonth))
      .filter((day) => day >= firstBookableDay && day <= lastBookableDay)
      .filter((day) => slotsFor(day).length > 0)
      .map(toDateKey),
  )

  const availableSlots = selectedDate ? slotsFor(selectedDate) : []

  const canGoToPreviousMonth = visibleMonth > startOfMonth(firstBookableDay)
  const canGoToNextMonth = addMonths(visibleMonth, 1) <= lastBookableDay

  function isDateBookable(date: Date): boolean {
    return bookableDays.has(toDateKey(date))
  }

  function goToPreviousMonth() {
    setVisibleMonth((current) => addMonths(current, -1))
  }

  function goToNextMonth() {
    setVisibleMonth((current) => addMonths(current, 1))
  }

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

    try {
      await createAppointment({
        businessId,
        customerId,
        customerName,
        professionalId: selectedProfessionalId,
        serviceId: selectedServiceId,
        start: selectedSlot.start,
        end: selectedSlot.end,
      })
    } catch (error) {
      setSelectedSlot(null)
      setScheduleVersion((version) => version + 1)
      throw error instanceof FirebaseError && error.code === 'permission-denied'
        ? new Error(
            'Não foi possível confirmar: este horário acabou de ser ocupado ou não está mais ' +
              'disponível. Escolha outro horário.',
          )
        : toFriendlyError(error)
    }

    return true
  }

  return {
    loading,
    services,
    availableProfessionals,
    availableSlots,
    visibleMonth,
    canGoToPreviousMonth,
    canGoToNextMonth,
    goToPreviousMonth,
    goToNextMonth,
    isDateBookable,
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
