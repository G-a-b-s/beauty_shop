import { useNavigate } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCurrentBusinessId } from '../../businesses/hooks/useCurrentBusinessId'
import { useProfessionals } from '../hooks/useProfessionals'

export function ProfessionalListScreen() {
  const businessId = useCurrentBusinessId()
  const { professionals, loading, toggleActive } = useProfessionals(businessId)
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-900">Profissionais</h1>
        <Button onClick={() => navigate('/professionals/new')}>Novo profissional</Button>
      </div>

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-neutral-500">Carregando…</p>}

        {!loading && professionals.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum profissional cadastrado</p>
        )}

        {professionals.map((professional) => (
          <Card
            key={professional.id}
            className={`flex items-center justify-between gap-4 p-5 ${
              professional.active ? '' : 'opacity-60'
            }`}
          >
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() => navigate(`/professionals/${professional.id}/edit`)}
            >
              <span className="font-medium text-neutral-900">{professional.name}</span>
              {!professional.active && (
                <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                  Inativo
                </span>
              )}
              <span className="mt-1 block text-sm text-neutral-500">{professional.phone}</span>
              <span className="block text-sm text-neutral-500">
                {professional.serviceIds.length}{' '}
                {professional.serviceIds.length === 1 ? 'serviço' : 'serviços'}
              </span>
            </button>

            <Button
              variant="secondary"
              onClick={() => toggleActive(professional.id, !professional.active)}
            >
              {professional.active ? 'Inativar' : 'Reativar'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
