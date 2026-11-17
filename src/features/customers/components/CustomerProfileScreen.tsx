import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { FormProblems } from '../../../shared/ui/FormProblems'
import { Input } from '../../../shared/ui/Input'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCustomerProfile } from '../hooks/useCustomerProfile'
import type { Customer } from '../types'

type FormProps = {
  customer: Customer
  email: string
  onSave: (name: string, phone: string) => Promise<void>
}

function CustomerProfileForm({ customer, email, onSave }: FormProps) {
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(name.trim(), phone)
      setSaved(true)
    } catch {
      setError('Não foi possível salvar. Tente novamente')
    } finally {
      setSaving(false)
    }
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
      <Input label="E-mail" value={email} readOnly disabled />
      <Input label="CPF" value={customer.cpf} readOnly disabled />

      {saved && <p className="text-sm text-primary-700">Dados atualizados</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {name.trim().length === 0 && <FormProblems problems={['informe o seu nome']} />}

      <Button
        type="submit"
        disabled={saving || name.trim().length === 0}
        className="mt-2 w-full"
      >
        {saving ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

export function CustomerProfileScreen() {
  const { account } = useAuth()
  const { customer, loading, save } = useCustomerProfile(account?.uid ?? '')

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  if (!customer) {
    return <p className="text-sm text-neutral-500">Não foi possível carregar seus dados</p>
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold text-neutral-900">Meus dados</h1>
      <Card className="mt-4">
        <CustomerProfileForm customer={customer} email={account?.email ?? ''} onSave={save} />
      </Card>
    </div>
  )
}
