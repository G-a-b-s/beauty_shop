import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
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

  const durationValue = Number(duration)
  const priceValue = Number(price)
  const isValid =
    name.trim().length > 0 &&
    Number.isInteger(durationValue) &&
    durationValue > 0 &&
    priceValue >= 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    await onSubmit({
      name: name.trim(),
      durationMinutes: durationValue,
      price: priceValue,
    })
    setSubmitting(false)
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
  const { services, loading, create, update, toggleActive } = useServiceCatalog(businessId)
  const [editing, setEditing] = useState<Service | 'new' | null>(null)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-900">Serviços</h1>
        {!editing && <Button onClick={() => setEditing('new')}>Novo serviço</Button>}
      </div>

      {editing && (
        <div className="mt-4">
          <ServiceForm
            service={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (draft) => {
              if (editing === 'new') {
                await create(draft)
              } else {
                await update(editing.id, draft)
              }
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

            <Button variant="secondary" onClick={() => toggleActive(service.id, !service.active)}>
              {service.active ? 'Inativar' : 'Reativar'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
