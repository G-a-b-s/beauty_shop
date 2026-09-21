# feat_prot03 — Novo agendamento

**Conta:** Cliente
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Depende de:** `feat_prot02` (chegada via botão "Agendar")
**Integração futura:** `feat_data03`

---

## Objetivo

Fluxo de criação de um agendamento: escolher serviço → profissional → data/horário disponível →
confirmar. É a tela que mais concentra regras de negócio do sistema (RN01 a RN09).

## Regra de acesso

Só cliente.

## Elementos de tela

Fluxo em passos (wizard simples, não precisa ser uma tela só):

1. **Escolher serviço** — lista dos serviços ativos do empreendimento (vindos do `feat_prot02`)
2. **Escolher profissional** — só profissionais ativos que têm o serviço escolhido em
   `serviceIds` (RN04)
3. **Escolher data e horário** — calendário/lista de horários livres do profissional escolhido,
   considerando jornada, folga e agendamentos já existentes (RN01, RN02, RN03, RN05, RN06)
4. **Confirmar** — resumo (serviço, profissional, data/hora, duração, preço) + botão "Confirmar
   agendamento"

## Dado mockado

Além de `Service` e `Professional` (de `feat_prot02`), precisa mockar `Shift`, `TimeOff` e
`Appointment` para o cálculo de horários livres ter o que considerar:

```ts
// embutido no Professional (campo shifts[]), conforme docs/arquitetura.md
type Shift = {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
  startTime: string // "09:00"
  endTime: string // "18:00"
}

type TimeOff = {
  professionalId: string
  date: string // "2026-09-20"
  reason?: string
}

type Appointment = {
  id: string
  businessId: string
  customerId: string
  professionalId: string
  serviceId: string
  businessName: string
  professionalName: string
  serviceName: string
  durationMinutes: number
  start: string // ISO
  end: string // ISO
  status: 'scheduled' | 'completed' | 'cancelled' | 'noShow'
}
```

Os campos `businessName`, `professionalName`, `serviceName` e `durationMinutes` são a
**denormalização controlada** decidida em `docs/arquitetura.md` — cópia histórica do que foi
combinado com o cliente, não espelho. O mock já nasce com eles para o formato do dado não mudar
quando a `feat_data03` ligar no Firestore.

Mockar pelo menos um profissional com folga marcada e outro com agendamento já ocupando parte do
dia, para o cálculo de horário livre (RF04) ter caso de borda real pra mostrar — não só um dia
totalmente vazio.

## Interações

- O cálculo de horários livres é a mesma lógica que **já está prevista para virar `domain/` puro**
  (`docs/arquitetura.md`, seção 5) — construir aqui como função pura reutilizável, não espalhada
  no componente. Isso evita retrabalho quando a Etapa de TDD pontual (RN01) for feita a sério.
- Não deixa confirmar se nenhum horário foi escolhido
- Não mostra horário em data passada (RN06)
- Ao confirmar, adiciona o novo agendamento na lista mockada em memória e navega para
  `feat_prot04` (Meus agendamentos)

## Fora de escopo (por enquanto)

- Pagamento ou sinal de reserva
- Notificação de confirmação (P5 do modelo de domínio)
- Reagendamento (só cancelar, ver `feat_prot04`)
