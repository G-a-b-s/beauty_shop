export type Business = {
  id: string
  name: string
  phone: string
  address: string
  city: string
  active: boolean
}

export type Service = {
  id: string
  businessId: string
  name: string
  durationMinutes: number
  price: number
  active: boolean
}

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

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
}

export type MockAccountType = 'customer' | 'business' | 'professional'

export type MockAccount = {
  uid: string
  email: string
  password: string
  type: MockAccountType
  name: string
  businessId?: string
}

export type TimeOff = {
  id: string
  professionalId: string
  date: string
  reason?: string
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'noShow'

export type Appointment = {
  id: string
  businessId: string
  customerId: string
  professionalId: string
  serviceId: string
  businessName: string
  professionalName: string
  customerName: string
  serviceName: string
  durationMinutes: number
  start: string
  end: string
  status: AppointmentStatus
}

export const mockAccounts: MockAccount[] = [
  {
    uid: 'customer-demo',
    email: 'cliente@demo.com',
    password: '123456',
    type: 'customer',
    name: 'Clara Demo',
  },
  {
    uid: 'business-1',
    email: 'salao@demo.com',
    password: '123456',
    type: 'business',
    name: 'Salão Bella Vita',
  },
  {
    uid: 'professional-1',
    email: 'ana@demo.com',
    password: '123456',
    type: 'professional',
    name: 'Ana Souza',
    businessId: 'business-1',
  },
]

export const mockBusinesses: Business[] = [
  {
    id: 'business-1',
    name: 'Salão Bella Vita',
    phone: '(11) 91234-5678',
    address: 'Rua das Flores, 120',
    city: 'São Paulo',
    active: true,
  },
  {
    id: 'business-2',
    name: 'Barbearia Vintage',
    phone: '(21) 99876-5432',
    address: 'Av. Atlântica, 500',
    city: 'Rio de Janeiro',
    active: true,
  },
  {
    id: 'business-3',
    name: 'Espaço Beleza Pura',
    phone: '(31) 98765-4321',
    address: 'Rua da Bahia, 300',
    city: 'Belo Horizonte',
    active: true,
  },
  {
    id: 'business-4',
    name: 'Studio Hair Design',
    phone: '(11) 97654-3210',
    address: 'Alameda Santos, 45',
    city: 'São Paulo',
    active: true,
  },
  {
    id: 'business-5',
    name: 'Barbearia do Zé',
    phone: '(41) 96543-2109',
    address: 'Rua XV de Novembro, 800',
    city: 'Curitiba',
    active: false,
  },
]

export const mockServices: Service[] = [
  {
    id: 'service-1',
    businessId: 'business-1',
    name: 'Corte feminino',
    durationMinutes: 60,
    price: 90,
    active: true,
  },
  {
    id: 'service-2',
    businessId: 'business-1',
    name: 'Escova',
    durationMinutes: 45,
    price: 60,
    active: true,
  },
  {
    id: 'service-3',
    businessId: 'business-1',
    name: 'Coloração',
    durationMinutes: 120,
    price: 180,
    active: true,
  },
  {
    id: 'service-4',
    businessId: 'business-2',
    name: 'Corte masculino',
    durationMinutes: 30,
    price: 45,
    active: true,
  },
  {
    id: 'service-5',
    businessId: 'business-2',
    name: 'Barba',
    durationMinutes: 20,
    price: 30,
    active: true,
  },
  {
    id: 'service-6',
    businessId: 'business-3',
    name: 'Manicure',
    durationMinutes: 40,
    price: 35,
    active: true,
  },
  {
    id: 'service-7',
    businessId: 'business-4',
    name: 'Corte feminino',
    durationMinutes: 60,
    price: 100,
    active: true,
  },
]

function shiftsFor(weekdays: Weekday[], startTime: string, endTime: string): Shift[] {
  return weekdays.map((weekday) => ({ weekday, startTime, endTime }))
}

export const mockProfessionals: Professional[] = [
  {
    id: 'professional-1',
    businessId: 'business-1',
    name: 'Ana Souza',
    phone: '(11) 91111-1111',
    serviceIds: ['service-1', 'service-2'],
    shifts: shiftsFor([1, 2, 3, 4, 5], '09:00', '18:00'),
    active: true,
  },
  {
    id: 'professional-2',
    businessId: 'business-1',
    name: 'Bruna Lima',
    phone: '(11) 92222-2222',
    serviceIds: ['service-1', 'service-3'],
    shifts: shiftsFor([2, 4], '10:00', '16:00'),
    active: true,
  },
  {
    id: 'professional-3',
    businessId: 'business-2',
    name: 'Carlos Dias',
    phone: '(21) 93333-3333',
    serviceIds: ['service-4', 'service-5'],
    shifts: shiftsFor([1, 2, 3, 4, 5, 6], '09:00', '19:00'),
    active: true,
  },
  {
    id: 'professional-4',
    businessId: 'business-3',
    name: 'Débora Reis',
    phone: '(31) 94444-4444',
    serviceIds: ['service-6'],
    shifts: shiftsFor([1, 2, 3, 4, 5], '09:00', '17:00'),
    active: true,
  },
  {
    id: 'professional-5',
    businessId: 'business-4',
    name: 'Eduardo Melo',
    phone: '(11) 95555-5555',
    serviceIds: ['service-7'],
    shifts: shiftsFor([1, 2, 3, 4, 5], '09:00', '18:00'),
    active: false,
  },
]

function daysAgo(days: number): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date
}

function daysAhead(days: number): Date {
  return daysAgo(-days)
}

function nextWeekday(weekday: Weekday): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  do {
    date.setDate(date.getDate() + 1)
  } while (date.getDay() !== weekday)
  return date
}

function atTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result.toISOString()
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const mockTimeOff: TimeOff[] = [
  {
    id: 'time-off-1',
    professionalId: 'professional-1',
    date: dateKey(nextWeekday(3)),
    reason: 'Consulta médica',
  },
]

export const mockAppointments: Appointment[] = [
  {
    id: 'appointment-1',
    businessId: 'business-2',
    customerId: 'customer-other',
    professionalId: 'professional-3',
    serviceId: 'service-4',
    businessName: 'Barbearia Vintage',
    professionalName: 'Carlos Dias',
    customerName: 'Fernanda Alves',
    serviceName: 'Corte masculino',
    durationMinutes: 30,
    start: atTime(nextWeekday(1), '10:00'),
    end: atTime(nextWeekday(1), '10:30'),
    status: 'scheduled',
  },
  {
    id: 'appointment-2',
    businessId: 'business-1',
    customerId: 'customer-other',
    professionalId: 'professional-1',
    serviceId: 'service-1',
    businessName: 'Salão Bella Vita',
    professionalName: 'Ana Souza',
    customerName: 'Gabriela Nunes',
    serviceName: 'Corte feminino',
    durationMinutes: 60,
    start: atTime(nextWeekday(2), '09:00'),
    end: atTime(nextWeekday(2), '10:00'),
    status: 'scheduled',
  },
  {
    id: 'appointment-3',
    businessId: 'business-1',
    customerId: 'customer-other-2',
    professionalId: 'professional-2',
    serviceId: 'service-3',
    businessName: 'Salão Bella Vita',
    professionalName: 'Bruna Lima',
    customerName: 'Helena Castro',
    serviceName: 'Coloração',
    durationMinutes: 120,
    start: atTime(nextWeekday(2), '11:00'),
    end: atTime(nextWeekday(2), '13:00'),
    status: 'scheduled',
  },
  {
    id: 'appointment-4',
    businessId: 'business-1',
    customerId: 'customer-other-3',
    professionalId: 'professional-1',
    serviceId: 'service-2',
    businessName: 'Salão Bella Vita',
    professionalName: 'Ana Souza',
    customerName: 'Isabela Rocha',
    serviceName: 'Escova',
    durationMinutes: 45,
    start: atTime(daysAgo(3), '10:00'),
    end: atTime(daysAgo(3), '10:45'),
    status: 'completed',
  },
  {
    id: 'appointment-5',
    businessId: 'business-1',
    customerId: 'customer-other-4',
    professionalId: 'professional-2',
    serviceId: 'service-1',
    businessName: 'Salão Bella Vita',
    professionalName: 'Bruna Lima',
    customerName: 'Joana Prado',
    serviceName: 'Corte feminino',
    durationMinutes: 60,
    start: atTime(daysAgo(5), '14:00'),
    end: atTime(daysAgo(5), '15:00'),
    status: 'completed',
  },
  {
    id: 'appointment-6',
    businessId: 'business-1',
    customerId: 'customer-other-5',
    professionalId: 'professional-1',
    serviceId: 'service-1',
    businessName: 'Salão Bella Vita',
    professionalName: 'Ana Souza',
    customerName: 'Larissa Moura',
    serviceName: 'Corte feminino',
    durationMinutes: 60,
    start: atTime(daysAgo(11), '11:00'),
    end: atTime(daysAgo(11), '12:00'),
    status: 'completed',
  },
  {
    id: 'appointment-7',
    businessId: 'business-1',
    customerId: 'customer-other-6',
    professionalId: 'professional-1',
    serviceId: 'service-2',
    businessName: 'Salão Bella Vita',
    professionalName: 'Ana Souza',
    customerName: 'Mariana Costa',
    serviceName: 'Escova',
    durationMinutes: 45,
    start: atTime(daysAgo(18), '15:00'),
    end: atTime(daysAgo(18), '15:45'),
    status: 'noShow',
  },
  {
    id: 'appointment-8',
    businessId: 'business-1',
    customerId: 'customer-other-7',
    professionalId: 'professional-1',
    serviceId: 'service-2',
    businessName: 'Salão Bella Vita',
    professionalName: 'Ana Souza',
    customerName: 'Natália Brito',
    serviceName: 'Escova',
    durationMinutes: 45,
    start: atTime(daysAhead(8), '16:00'),
    end: atTime(daysAhead(8), '16:45'),
    status: 'scheduled',
  },
  {
    id: 'appointment-9',
    businessId: 'business-1',
    customerId: 'customer-other-8',
    professionalId: 'professional-1',
    serviceId: 'service-1',
    businessName: 'Salão Bella Vita',
    professionalName: 'Ana Souza',
    customerName: 'Olívia Freitas',
    serviceName: 'Corte feminino',
    durationMinutes: 60,
    start: atTime(daysAhead(15), '09:00'),
    end: atTime(daysAhead(15), '10:00'),
    status: 'scheduled',
  },
]

export const mockCustomers: Customer[] = []

export function seedCustomer(customerId: string, name: string, email: string): Customer {
  const existing = mockCustomers.find((customer) => customer.id === customerId)
  if (existing) {
    return existing
  }

  const customer: Customer = {
    id: customerId,
    name,
    email,
    phone: '(11) 90000-0000',
    cpf: '000.000.000-00',
  }
  mockCustomers.push(customer)
  return customer
}

const seededCustomerIds = new Set<string>()

export function seedAppointmentsForCustomer(customerId: string, customerName: string): void {
  if (!customerId || seededCustomerIds.has(customerId)) {
    return
  }
  seededCustomerIds.add(customerId)

  mockAppointments.push(
    {
      id: `seed-${customerId}-1`,
      businessId: 'business-1',
      customerId,
      professionalId: 'professional-1',
      serviceId: 'service-2',
      businessName: 'Salão Bella Vita',
      professionalName: 'Ana Souza',
      customerName,
      serviceName: 'Escova',
      durationMinutes: 45,
      start: atTime(nextWeekday(4), '14:00'),
      end: atTime(nextWeekday(4), '14:45'),
      status: 'scheduled',
    },
    {
      id: `seed-${customerId}-2`,
      businessId: 'business-1',
      customerId,
      professionalId: 'professional-2',
      serviceId: 'service-3',
      businessName: 'Salão Bella Vita',
      professionalName: 'Bruna Lima',
      customerName,
      serviceName: 'Coloração',
      durationMinutes: 120,
      start: atTime(daysAgo(14), '09:00'),
      end: atTime(daysAgo(14), '11:00'),
      status: 'completed',
    },
    {
      id: `seed-${customerId}-3`,
      businessId: 'business-2',
      customerId,
      professionalId: 'professional-3',
      serviceId: 'service-5',
      businessName: 'Barbearia Vintage',
      professionalName: 'Carlos Dias',
      customerName,
      serviceName: 'Barba',
      durationMinutes: 20,
      start: atTime(daysAgo(30), '16:00'),
      end: atTime(daysAgo(30), '16:20'),
      status: 'cancelled',
    },
    {
      id: `seed-${customerId}-4`,
      businessId: 'business-3',
      customerId,
      professionalId: 'professional-4',
      serviceId: 'service-6',
      businessName: 'Espaço Beleza Pura',
      professionalName: 'Débora Reis',
      customerName,
      serviceName: 'Manicure',
      durationMinutes: 40,
      start: atTime(daysAgo(45), '10:00'),
      end: atTime(daysAgo(45), '10:40'),
      status: 'noShow',
    },
  )
}
