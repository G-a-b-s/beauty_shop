# feat_prot02 — Detalhes do empreendimento

**Conta:** Cliente
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Depende de:** `feat_prot01` (chegada via clique no cartão do empreendimento)
**Integração futura:** `feat_data02`

---

## Objetivo

Mostrar as informações de um empreendimento específico: dados de contato, serviços oferecidos e
profissionais disponíveis. Ponto de partida para o agendamento.

## Regra de acesso

Só cliente. Só exibe empreendimentos com `active: true` — se o `id` da URL apontar para um
empreendimento inativo ou inexistente, mostrar estado de "não encontrado".

## Elementos de tela

- Cabeçalho: nome, endereço, cidade, telefone do empreendimento
- Lista de serviços oferecidos: nome, duração, preço (só serviços com `active: true`)
- Lista de profissionais: nome, quais serviços da lista acima cada um executa (só `active: true`)
- Botão "Agendar" — vai para `feat_prot03` (Novo agendamento), levando o `businessId`

## Dado mockado

Reaproveita o mock de `Business` de `feat_prot01`, mais os mocks de `Service` e `Professional`:

```ts
type Service = {
  id: string
  businessId: string
  name: string
  durationMinutes: number
  price: number
  active: boolean
}

type Professional = {
  id: string
  businessId: string
  name: string
  phone: string
  serviceIds: string[]
  active: boolean
}
```

Cada empreendimento mockado em `feat_prot01` precisa ter pelo menos 2 serviços e 2 profissionais
associados (por `businessId`), com sobreposição parcial de `serviceIds` entre os profissionais —
para o `feat_prot03` ter caso de teste de "nem todo profissional faz todo serviço" (RN04).

## Interações

- Nenhuma edição nesta tela — é só visualização
- Clicar num profissional não faz nada aqui (a escolha de profissional acontece dentro do
  `feat_prot03`)

## Fora de escopo (por enquanto)

- Fotos/portfólio do empreendimento ou dos profissionais
- Avaliações/reviews de clientes
