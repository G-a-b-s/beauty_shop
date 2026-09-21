import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useBusinessDetails } from '../hooks/useBusinessDetails'

export function BusinessDetailsScreen() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { business, services, professionals, loading, notFound } = useBusinessDetails(businessId)

  if (loading) {
    return <p className="text-sm text-neutral-500">Carregando…</p>
  }

  if (notFound || !business) {
    return <p className="text-sm text-neutral-500">Empreendimento não encontrado</p>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <h1 className="text-xl font-semibold text-neutral-900">{business.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{business.address}</p>
        <p className="text-sm text-neutral-500">{business.city}</p>
        <p className="text-sm text-neutral-500">{business.phone}</p>
      </Card>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-neutral-700">Serviços</h2>
        <div className="mt-2 grid gap-2">
          {services.map((service) => (
            <Card key={service.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-neutral-900">{service.name}</p>
                <p className="text-sm text-neutral-500">{service.durationMinutes} min</p>
              </div>
              <p className="font-medium text-neutral-900">
                {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-neutral-700">Profissionais</h2>
        <div className="mt-2 grid gap-2">
          {professionals.map((professional) => {
            const professionalServices = services.filter((service) =>
              professional.serviceIds.includes(service.id),
            )
            return (
              <Card key={professional.id} className="p-4">
                <p className="font-medium text-neutral-900">{professional.name}</p>
                <p className="text-sm text-neutral-500">
                  {professionalServices.map((service) => service.name).join(', ')}
                </p>
              </Card>
            )
          })}
        </div>
      </div>

      <Button className="mt-6 w-full" onClick={() => navigate(`/businesses/${business.id}/book`)}>
        Agendar
      </Button>
    </div>
  )
}
