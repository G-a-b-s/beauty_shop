import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { FormProblems } from '../../../shared/ui/FormProblems'
import { useConfirm } from '../../../shared/ui/useConfirm'
import { Input } from '../../../shared/ui/Input'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useServiceCatalog } from '../hooks/useServiceCatalog'
import type { Service, ServiceDraft } from '../types'

type FormProps = {
  service?: Service
  onSubmit: (draft: ServiceDraft) => Promise<void>
  onCancel: () => void
}

function ServiceForm({ service, onSubmit, onCancel }: FormProps) {
  const [name, setName] = useState(service?.name ?? '')
  const [duration, setDuration] = useState(String(service?.durationMinutes ?? 30))
  const [price, setPrice] = useState(String(service?.price ?? 0))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const durationValue = Number(duration)
  const priceValue = Number(price)
  const problems = [
    name.trim().length === 0 && 'informe o nome do serviço',
    !(Number.isInteger(durationValue) && durationValue > 0) &&
      'a duração deve ser um número inteiro de minutos, maior que zero (RN10)',
    (price.trim() === '' || Number.isNaN(priceValue) || priceValue < 0) &&
      'informe um preço igual ou maior que zero',
  ].filter((problem): problem is string => Boolean(problem))
  const isValid = problems.length === 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        durationMinutes: durationValue,
        price: priceValue,
      })
    } catch (submitError) {
      setError((submitError as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Duração (minutos)"
          type="number"
          min={1}
          step={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        />
        <Input
          label="Preço"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {problems.length > 0 && <FormProblems problems={problems} />}

        <div className="flex gap-2">
          <Button type="submit" disabled={submitting || !isValid} className="flex-1">
            {submitting ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function ServiceCatalogScreen() {
  const businessId = useCurrentBusinessId()
  const { services, loading, create, update, toggleActive, error } = useServiceCatalog(businessId)
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  async function handleToggle(service: Service) {
    if (service.active) {
      const confirmed = await confirm({
        title: `Inativar ${service.name}?`,
        description:
          'O serviço deixa de aparecer para novos agendamentos. Os agendamentos já marcados ' +
          'continuam valendo. Dá para reativar depois.',
        confirmLabel: 'Inativar',
        tone: 'danger',
      })
      if (!confirmed) {
        return
      }
    }
    setMessage(null)
    if (await toggleActive(service.id, !service.active)) {
      setMessage(`Serviço ${service.name} ${service.active ? 'inativado' : 'reativado'}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-900">Serviços</h1>
        {!editing && (
          <Button
            onClick={() => {
              setMessage(null)
              setEditing('new')
            }}
          >
            Novo serviço
          </Button>
        )}
      </div>

      {message && <p className="mt-3 text-sm text-primary-700">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {editing && (
        <div className="mt-4">
          <ServiceForm
            key={editing === 'new' ? 'new' : editing.id}
            service={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (draft) => {
              if (editing === 'new') {
                await create(draft)
              } else {
                await update(editing.id, draft)
              }
              setMessage(`Serviço ${draft.name} ${editing === 'new' ? 'cadastrado' : 'atualizado'}`)
              setEditing(null)
            }}
          />
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-neutral-500">Carregando…</p>}

        {!loading && services.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum serviço cadastrado</p>
        )}

        {services.map((service) => (
          <Card
            key={service.id}
            className={`flex items-center justify-between gap-4 p-5 ${
              service.active ? '' : 'opacity-60'
            }`}
          >
            <button type="button" className="flex-1 text-left" onClick={() => setEditing(service)}>
              <span className="font-medium text-neutral-900">{service.name}</span>
              {!service.active && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                  Inativo
                </span>
              )}
              <span className="mt-1 block text-sm text-neutral-500">
                {service.durationMinutes} min ·{' '}
                {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </button>

            <Button variant="secondary" onClick={() => handleToggle(service)}>
              {service.active ? 'Inativar' : 'Reativar'}
            </Button>
          </Card>
        ))}
      </div>
      {dialog}
    </div>
  )
}
