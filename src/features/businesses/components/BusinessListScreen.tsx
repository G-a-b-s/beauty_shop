import { useNavigate } from 'react-router-dom'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useBusinesses } from '../hooks/useBusinesses'

export function BusinessListScreen() {
  const { businesses, loading, searchTerm, setSearchTerm } = useBusinesses()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900">Empreendimentos</h1>

      <div className="mt-4">
        <Input
          label="Buscar"
          placeholder="Buscar por nome ou cidade"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-neutral-500">Carregando…</p>}

        {!loading && businesses.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhum empreendimento encontrado</p>
        )}

        {businesses.map((business) => (
          <Card
            key={business.id}
            className="cursor-pointer p-5 transition-shadow hover:shadow-md"
            onClick={() => navigate(`/businesses/${business.id}`)}
          >
            <h2 className="font-medium text-neutral-900">{business.name}</h2>
            <p className="mt-1 text-sm text-neutral-500">{business.city}</p>
            <p className="text-sm text-neutral-500">{business.phone}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
