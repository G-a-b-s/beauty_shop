import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { FormProblems } from '../../../shared/ui/FormProblems'
import { useConfirm } from '../../../shared/ui/useConfirm'
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
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  const problems = [
    name.trim().length === 0 && 'informe o nome do profissional',
    services.length > 0 &&
      serviceIds.length === 0 &&
      'marque ao menos um serviço que o profissional executa (RN11)',
  ].filter((problem): problem is string => Boolean(problem))

  function toggleService(serviceId: string, checked: boolean) {
    setServiceIds((current) =>
      checked ? [...current, serviceId] : current.filter((id) => id !== serviceId),
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isEditing) {
      const confirmed = await confirm({
        title: `Cadastrar ${name.trim()}?`,
        description: (
          <>
            <p>
              Será criado um login de profissional com o e-mail <strong>{email.trim()}</strong> e a
              senha informada.
            </p>
            <p className="mt-2">
              Confira o e-mail: ele não pode ser alterado depois. O profissional pode ser
              inativado, mas não excluído.
            </p>
          </>
        ),
        confirmLabel: 'Cadastrar',
      })
      if (!confirmed) {
        return
      }
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), phone, email, password, serviceIds, shifts })
    } catch (submitError) {
      setError((submitError as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <>
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {problems.length > 0 && <FormProblems problems={problems} />}

        <Button
          type="submit"
          disabled={submitting || problems.length > 0 || serviceIds.length === 0}
          className="w-full"
        >
          {submitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>
      {dialog}
    </>
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
            navigate('/professionals', {
              state: {
                message: professional
                  ? `Dados de ${data.name} atualizados`
                  : `${data.name} cadastrado. O login é ${data.email.trim()}`,
              },
            })
          }}
        />
      </div>
    </div>
  )
}
