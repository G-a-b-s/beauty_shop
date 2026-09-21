import { Card } from '../../../shared/ui/Card'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useProductivity, type PeriodOption } from '../hooks/useProductivity'

const periodOptions: { value: PeriodOption; label: string }[] = [
  { value: 7, label: 'Últimos 7 dias' },
  { value: 30, label: 'Últimos 30 dias' },
]

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`
}

export function ProductivityScreen() {
  const businessId = useCurrentBusinessId()
  const { metrics, loading, periodDays, setPeriodDays } = useProductivity(businessId)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">Produtividade</h1>

      <div className="mt-4 flex gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriodDays(option.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              periodDays === option.value
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-neutral-500">Carregando…</p>}

        {!loading && metrics.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum profissional cadastrado</p>
        )}

        {metrics.map(
          ({ professional, completedCount, busyMinutes, availableMinutes, occupancyRate }) => (
            <Card key={professional.id} className="p-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium text-neutral-900">{professional.name}</p>
                <p className="text-lg font-semibold text-primary-700">
                  {(occupancyRate * 100).toFixed(1)}%
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-primary-500"
                  style={{ width: `${Math.min(100, occupancyRate * 100)}%` }}
                />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-neutral-500">Atendimentos</dt>
                  <dd className="font-medium text-neutral-900">{completedCount}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Ocupado</dt>
                  <dd className="font-medium text-neutral-900">{formatHours(busyMinutes)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Disponível</dt>
                  <dd className="font-medium text-neutral-900">{formatHours(availableMinutes)}</dd>
                </div>
              </dl>
            </Card>
          ),
        )}
      </div>
    </div>
  )
}
