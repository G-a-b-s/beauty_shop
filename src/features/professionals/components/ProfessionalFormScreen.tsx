import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import type { Service } from '../../services-catalog/types'
import { useProfessionalForm } from '../hooks/useProfessionalForm'
import type { Professional, Shift } from '../types'
import { WeeklyShiftEditor } from './WeeklyShiftEditor'

type FormProps = {
  services: Service[]
  professional?: Professional
  onSubmit: (data: {
    name: string
    phone: string
    email: string
    password: string
    serviceIds: string[]
    shifts: Shift[]
  }) => Promise<void>
}

function ProfessionalForm({ services, professional, onSubmit }: FormProps) {
  const isEditing = Boolean(professional)
  const [name, setName] = useState(professional?.name ?? '')
  const [phone, setPhone] = useState(professional?.phone ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serviceIds, setServiceIds] = useState<string[]>(professional?.serviceIds ?? [])
  const [shifts, setShifts] = useState<Shift[]>(professional?.shifts ?? [])
  const [submitting, setSubmitting] = useState(false)

  function toggleService(serviceId: string, checked: boolean) {
    setServiceIds((current) =>
      checked ? [...current, serviceId] : current.filter((id) => id !== serviceId),
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    await onSubmit({ name: name.trim(), phone, email, password, serviceIds, shifts })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <h2 className="text-sm font-medium text-neutral-700">Dados pessoais</h2>
        <div className="mt-3 grid gap-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </Card>

      {!isEditing && (
        <Card>
          <h2 className="text-sm font-medium text-neutral-700">Acesso do profissional</h2>
          <div className="mt-3 grid gap-4">
            <Input
              label="E-mail de login"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Senha inicial"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-sm font-medium text-neutral-700">Serviços que executa</h2>
        <div className="mt-3 grid gap-2">
          {services.length === 0 && (
            <p className="text-sm text-neutral-500">
              Cadastre um serviço antes de cadastrar profissionais
            </p>
          )}
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={serviceIds.includes(service.id)}
                onChange={(e) => toggleService(service.id, e.target.checked)}
                className="size-4 rounded border-neutral-300 accent-primary-600"
              />
              {service.name}
              <span className="text-neutral-400">{service.durationMinutes} min</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-neutral-700">Jornada semanal</h2>
        <div className="mt-3">
          <WeeklyShiftEditor shifts={shifts} onChange={setShifts} />
        </div>
      </Card>

      <Button
        type="submit"
        disabled={submitting || name.trim().length === 0 || serviceIds.length === 0}
        className="w-full"
      >
        {submitting ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

export function ProfessionalFormScreen() {
  const { professionalId } = useParams<{ professionalId: string }>()
  const businessId = useCurrentBusinessId()
  const navigate = useNavigate()
  const { services, professional, loading, create, update } = useProfessionalForm(
    businessId,
    professionalId,
  )

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  if (professionalId && !professional) {
    return <p className="text-sm text-neutral-500">Profissional não encontrado</p>
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-neutral-900">
        {professional ? 'Editar profissional' : 'Novo profissional'}
      </h1>

      <div className="mt-4">
        <ProfessionalForm
          services={services}
          professional={professional}
          onSubmit={async (data) => {
            if (professional) {
              await update({
                name: data.name,
                phone: data.phone,
                serviceIds: data.serviceIds,
                shifts: data.shifts,
              })
            } else {
              await create(data)
            }
            navigate('/professionals')
          }}
        />
      </div>
    </div>
  )
}
