import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { formatDateTimeLabel, formatDayLabel, formatTimeLabel } from '../../../shared/lib/date'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useBookAppointment } from '../hooks/useBookAppointment'

const optionStyles =
  'rounded-xl border px-4 py-3 text-left text-sm transition-colors border-neutral-200 hover:border-primary-300'
const selectedOptionStyles = 'border-primary-500 bg-primary-50 text-primary-700'

export function BookAppointmentScreen() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { account } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const {
    loading,
    services,
    availableProfessionals,
    availableDates,
    availableSlots,
    selectedService,
    selectedProfessional,
    selectedDate,
    selectedSlot,
    selectService,
    selectProfessional,
    selectDate,
    setSelectedSlot,
    confirm,
  } = useBookAppointment(businessId, account?.uid ?? '', account?.name ?? '')

  async function handleConfirm() {
    setSubmitting(true)
    const created = await confirm()
    setSubmitting(false)
    if (created) {
      navigate('/appointments')
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Novo agendamento</h1>

      <Card>
        <h2 className="text-sm font-medium text-neutral-700">1. Escolha o serviço</h2>
        <div className="mt-3 grid gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => selectService(service.id)}
              className={`${optionStyles} ${
                selectedService?.id === service.id ? selectedOptionStyles : 'text-neutral-700'
              }`}
            >
              <span className="font-medium">{service.name}</span>
              <span className="ml-2 text-neutral-500">
                {service.durationMinutes} min ·{' '}
                {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {selectedService && (
        <Card>
          <h2 className="text-sm font-medium text-neutral-700">2. Escolha o profissional</h2>
          <div className="mt-3 grid gap-2">
            {availableProfessionals.length === 0 && (
              <p className="text-sm text-neutral-500">
                Nenhum profissional executa esse serviço no momento
              </p>
            )}
            {availableProfessionals.map((professional) => (
              <button
                key={professional.id}
                type="button"
                onClick={() => selectProfessional(professional.id)}
                className={`${optionStyles} ${
                  selectedProfessional?.id === professional.id
                    ? selectedOptionStyles
                    : 'text-neutral-700'
                }`}
              >
                {professional.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {selectedProfessional && (
        <Card>
          <h2 className="text-sm font-medium text-neutral-700">3. Escolha a data e o horário</h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {availableDates.map((date) => (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => selectDate(date)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  selectedDate && selectedDate.getTime() === date.getTime()
                    ? selectedOptionStyles
                    : 'border-neutral-200 text-neutral-700 hover:border-primary-300'
                }`}
              >
                {formatDayLabel(date)}
              </button>
            ))}
          </div>

          {selectedDate && (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableSlots.length === 0 && (
                <p className="text-sm text-neutral-500">
                  Nenhum horário livre nesta data
                </p>
              )}
              {availableSlots.map((slot) => (
                <button
                  key={slot.start.toISOString()}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                    selectedSlot?.start.getTime() === slot.start.getTime()
                      ? selectedOptionStyles
                      : 'border-neutral-200 text-neutral-700 hover:border-primary-300'
                  }`}
                >
                  {formatTimeLabel(slot.start)}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {selectedSlot && selectedService && selectedProfessional && (
        <Card>
          <h2 className="text-sm font-medium text-neutral-700">4. Confirme o agendamento</h2>
          <dl className="mt-3 grid gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Serviço</dt>
              <dd className="font-medium text-neutral-900">{selectedService.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Profissional</dt>
              <dd className="font-medium text-neutral-900">{selectedProfessional.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Quando</dt>
              <dd className="font-medium text-neutral-900">
                {formatDateTimeLabel(selectedSlot.start)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Duração</dt>
              <dd className="font-medium text-neutral-900">
                {selectedService.durationMinutes} min
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Preço</dt>
              <dd className="font-medium text-neutral-900">
                {selectedService.price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </dd>
            </div>
          </dl>

          <Button className="mt-5 w-full" disabled={submitting} onClick={handleConfirm}>
            {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
          </Button>
        </Card>
      )}
    </div>
  )
}
