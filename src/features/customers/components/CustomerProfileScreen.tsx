import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCustomerProfile } from '../hooks/useCustomerProfile'
import type { Customer } from '../types'

type FormProps = {
  customer: Customer
  onSave: (name: string, phone: string) => Promise<void>
}

function CustomerProfileForm({ customer, onSave }: FormProps) {
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await onSave(name.trim(), phone)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Input
        label="Nome"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setSaved(false)
        }}
        required
      />
      <Input
        label="Telefone"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value)
          setSaved(false)
        }}
      />
      <Input label="E-mail" value={customer.email} readOnly disabled />
      <Input label="CPF" value={customer.cpf} readOnly disabled />

      {saved && <p className="text-sm text-primary-700">Dados atualizados</p>}

      <Button type="submit" disabled={name.trim().length === 0} className="mt-2 w-full">
        Salvar
      </Button>
    </form>
  )
}

export function CustomerProfileScreen() {
  const { account } = useAuth()
  const { customer, loading, save } = useCustomerProfile(
    account?.uid ?? '',
    account?.name ?? '',
    account?.email ?? '',
  )

  if (loading || !customer) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold text-neutral-900">Meus dados</h1>
      <Card className="mt-4">
        <CustomerProfileForm customer={customer} onSave={save} />
      </Card>
    </div>
  )
}
