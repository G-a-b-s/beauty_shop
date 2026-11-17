import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../../shared/lib/firebase'
import { toDate, toTimestamp } from '../../../shared/lib/firestore'
import type { TimeRange } from '../domain/conflict'
import type { Appointment, AppointmentStatus, NewAppointment, Shift, TimeOff } from '../types'

function toShift(data: DocumentData): Shift {
  return {
    weekday: data.weekday,
    startTime: data.startTime,
    endTime: data.endTime,
  }
}

function toTimeOff(
  professionalId: string,
  snapshot: QueryDocumentSnapshot<DocumentData>,
): TimeOff {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    professionalId,
    date: data.date,
    reason: data.reason,
  }
}

function toBusySlot(snapshot: QueryDocumentSnapshot<DocumentData>): TimeRange {
  const data = snapshot.data()
  return {
    start: toDate(data.start),
    end: toDate(data.end),
  }
}

function toAppointment(snapshot: QueryDocumentSnapshot<DocumentData>): Appointment {
  const data = snapshot.data()
  const businessRef = snapshot.ref.parent.parent
  if (!businessRef) {
    throw new Error('Agendamento fora de um empreendimento.')
  }
  return {
    id: snapshot.id,
    businessId: businessRef.id,
    customerId: data.customerId,
    professionalId: data.professionalId,
    serviceId: data.serviceId,
    businessName: data.businessName,
    professionalName: data.professionalName,
    customerName: data.customerName,
    serviceName: data.serviceName,
    durationMinutes: data.durationMinutes,
    start: toDate(data.start).toISOString(),
    end: toDate(data.end).toISOString(),
    status: data.status,
  }
}

export async function listShiftsForProfessional(
  businessId: string,
  professionalId: string,
): Promise<Shift[]> {
  if (!businessId || !professionalId) {
    return []
  }
  const snapshot = await getDoc(doc(db, 'businesses', businessId, 'professionals', professionalId))
  const shifts: DocumentData[] = snapshot.data()?.shifts ?? []
  return shifts.map(toShift)
}

export async function listTimeOffForProfessional(
  businessId: string,
  professionalId: string,
): Promise<TimeOff[]> {
  if (!businessId || !professionalId) {
    return []
  }
  const snapshot = await getDocs(
    collection(db, 'businesses', businessId, 'professionals', professionalId, 'timeOff'),
  )
  return snapshot.docs.map((entry) => toTimeOff(professionalId, entry))
}

export async function listBusySlotsForProfessional(
  businessId: string,
  professionalId: string,
): Promise<TimeRange[]> {
  if (!businessId || !professionalId) {
    return []
  }
  const snapshot = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'professionals', professionalId, 'busySlots'),
      where('end', '>', toTimestamp(new Date())),
    ),
  )
  return snapshot.docs.map(toBusySlot)
}

export async function listAppointmentsForProfessional(
  businessId: string,
  professionalId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<Appointment[]> {
  if (!businessId || !professionalId) {
    return []
  }
  const snapshot = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'appointments'),
      where('professionalId', '==', professionalId),
      where('start', '>=', toTimestamp(rangeStart)),
      where('start', '<', toTimestamp(rangeEnd)),
      orderBy('start'),
    ),
  )
  return snapshot.docs.map(toAppointment)
}

export async function listAppointmentsForCustomer(customerId: string): Promise<Appointment[]> {
  if (!customerId) {
    return []
  }
  const snapshot = await getDocs(
    query(
      collectionGroup(db, 'appointments'),
      where('customerId', '==', customerId),
      orderBy('start', 'desc'),
    ),
  )
  return snapshot.docs.map(toAppointment)
}

export async function listAppointmentsForBusiness(
  businessId: string,
  rangeStart: Date,
  rangeEnd: Date,
  status?: AppointmentStatus,
): Promise<Appointment[]> {
  if (!businessId) {
    return []
  }
  const appointments = collection(db, 'businesses', businessId, 'appointments')
  const range = [
    where('start', '>=', toTimestamp(rangeStart)),
    where('start', '<', toTimestamp(rangeEnd)),
    orderBy('start'),
  ]
  const snapshot = await getDocs(
    status
      ? query(appointments, where('status', '==', status), ...range)
      : query(appointments, ...range),
  )
  return snapshot.docs.map(toAppointment)
}

type AppointmentRef = Pick<Appointment, 'id' | 'businessId' | 'professionalId' | 'start'>

export async function setAppointmentStatus(
  appointment: AppointmentRef,
  status: AppointmentStatus,
): Promise<void> {
  const businessRef = doc(db, 'businesses', appointment.businessId)
  const appointmentRef = doc(businessRef, 'appointments', appointment.id)
  const busySlotRef = doc(
    businessRef,
    'professionals',
    appointment.professionalId,
    'busySlots',
    String(new Date(appointment.start).getTime()),
  )

  const batch = writeBatch(db)
  batch.update(appointmentRef, { status })
  batch.delete(busySlotRef)
  await batch.commit()
}

export async function createAppointment(data: NewAppointment): Promise<Appointment> {
  const businessRef = doc(db, 'businesses', data.businessId)
  const professionalRef = doc(businessRef, 'professionals', data.professionalId)
  const serviceRef = doc(businessRef, 'services', data.serviceId)

  const [businessSnapshot, professionalSnapshot, serviceSnapshot] = await Promise.all([
    getDoc(businessRef),
    getDoc(professionalRef),
    getDoc(serviceRef),
  ])
  const business = businessSnapshot.data()
  const professional = professionalSnapshot.data()
  const service = serviceSnapshot.data()
  if (!business || !professional || !service) {
    throw new Error('Empreendimento, profissional ou serviço não encontrado.')
  }

  const appointmentRef = doc(collection(businessRef, 'appointments'))
  const busySlotRef = doc(professionalRef, 'busySlots', String(data.start.getTime()))
  const start = toTimestamp(data.start)
  const end = toTimestamp(data.end)

  const appointment: Appointment = {
    id: appointmentRef.id,
    businessId: data.businessId,
    customerId: data.customerId,
    professionalId: data.professionalId,
    serviceId: data.serviceId,
    businessName: business.name,
    professionalName: professional.name,
    customerName: data.customerName,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    start: data.start.toISOString(),
    end: data.end.toISOString(),
    status: 'scheduled',
  }

  const batch = writeBatch(db)
  batch.set(appointmentRef, {
    businessId: appointment.businessId,
    customerId: appointment.customerId,
    professionalId: appointment.professionalId,
    serviceId: appointment.serviceId,
    businessName: appointment.businessName,
    professionalName: appointment.professionalName,
    customerName: appointment.customerName,
    serviceName: appointment.serviceName,
    durationMinutes: appointment.durationMinutes,
    start,
    end,
    status: appointment.status,
  })
  batch.set(busySlotRef, { appointmentId: appointmentRef.id, start, end })
  await batch.commit()

  return appointment
}
