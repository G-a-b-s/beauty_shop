import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthScreen } from '../features/auth/components/AuthScreen'
import { useAuth } from '../features/auth/hooks/useAuth'
import type { AccountType, AuthenticatedAccount } from '../features/auth/types'
import { BookAppointmentScreen } from '../features/appointments/components/BookAppointmentScreen'
import { BusinessScheduleScreen } from '../features/appointments/components/BusinessScheduleScreen'
import { CustomerAppointmentsScreen } from '../features/appointments/components/CustomerAppointmentsScreen'
import { ProfessionalAgendaScreen } from '../features/appointments/components/ProfessionalAgendaScreen'
import { BusinessDetailsScreen } from '../features/businesses/components/BusinessDetailsScreen'
import { BusinessListScreen } from '../features/businesses/components/BusinessListScreen'
import { CustomerProfileScreen } from '../features/customers/components/CustomerProfileScreen'
import { MyScheduleScreen } from '../features/professionals/components/MyScheduleScreen'
import { ProfessionalFormScreen } from '../features/professionals/components/ProfessionalFormScreen'
import { ProfessionalListScreen } from '../features/professionals/components/ProfessionalListScreen'
import { ProductivityScreen } from '../features/productivity/components/ProductivityScreen'
import { ServiceCatalogScreen } from '../features/services-catalog/components/ServiceCatalogScreen'
import { AppLayout } from './layout/AppLayout'

const homePathByType: Record<AccountType, string> = {
  customer: '/businesses',
  business: '/professionals',
  professional: '/my-schedule',
}

function guard(
  allowed: AccountType[],
  account: AuthenticatedAccount,
  element: ReactElement,
): ReactElement {
  return allowed.includes(account.type) ? element : <Navigate to={homePathByType[account.type]} replace />
}

export function AppRoutes() {
  const { account, status, signOutAccount } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-neutral-500">Carregando…</p>
      </div>
    )
  }

  if (status === 'signedOut' || !account) {
    return <AuthScreen />
  }

  const homePath = homePathByType[account.type]

  return (
    <AppLayout account={account} onSignOut={() => signOutAccount()}>
      <Routes>
        <Route path="/" element={<Navigate to={homePath} replace />} />

        <Route
          path="/businesses"
          element={guard(['customer'], account, <BusinessListScreen />)}
        />
        <Route
          path="/businesses/:businessId"
          element={guard(['customer'], account, <BusinessDetailsScreen />)}
        />
        <Route
          path="/businesses/:businessId/book"
          element={guard(['customer'], account, <BookAppointmentScreen />)}
        />
        <Route
          path="/appointments"
          element={guard(['customer'], account, <CustomerAppointmentsScreen />)}
        />
        <Route path="/profile" element={guard(['customer'], account, <CustomerProfileScreen />)} />

        <Route
          path="/professionals"
          element={guard(['business'], account, <ProfessionalListScreen />)}
        />
        <Route
          path="/professionals/new"
          element={guard(['business'], account, <ProfessionalFormScreen />)}
        />
        <Route
          path="/professionals/:professionalId/edit"
          element={guard(['business'], account, <ProfessionalFormScreen />)}
        />
        <Route path="/services" element={guard(['business'], account, <ServiceCatalogScreen />)} />
        <Route path="/schedule" element={guard(['business'], account, <BusinessScheduleScreen />)} />
        <Route path="/productivity" element={guard(['business'], account, <ProductivityScreen />)} />

        <Route
          path="/my-schedule"
          element={guard(['professional'], account, <ProfessionalAgendaScreen />)}
        />
        <Route path="/my-shift" element={guard(['professional'], account, <MyScheduleScreen />)} />

        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </AppLayout>
  )
}
