import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import type { AccountType, AuthenticatedAccount } from '../../features/auth/types'
import { Button } from '../../shared/ui/Button'

type NavItem = {
  to: string
  label: string
}

const navItemsByType: Record<AccountType, NavItem[]> = {
  customer: [
    { to: '/businesses', label: 'Empreendimentos' },
    { to: '/appointments', label: 'Meus agendamentos' },
    { to: '/profile', label: 'Meus dados' },
  ],
  business: [
    { to: '/professionals', label: 'Profissionais' },
    { to: '/services', label: 'Serviços' },
    { to: '/schedule', label: 'Agenda' },
    { to: '/productivity', label: 'Produtividade' },
  ],
  professional: [
    { to: '/my-schedule', label: 'Minha agenda' },
    { to: '/my-shift', label: 'Minha jornada' },
  ],
}

type Props = {
  account: AuthenticatedAccount
  onSignOut: () => void
  children: ReactNode
}

export function AppLayout({ account, onSignOut, children }: Props) {
  return (
    <div className="min-h-svh bg-primary-50/40">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="font-semibold text-neutral-900">Beauty Shop</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {account.name || account.email}
            </span>
            <Button variant="secondary" onClick={onSignOut}>
              Sair
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 pb-3">
          {navItemsByType[account.type].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
