# feat_data09 — Agenda do empreendimento

**Conta:** Empreendimento
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot09`](../prototype/feat_prot09-Agenda-do-empreendimento.md)
**Depende de:** `feat_data04` (reutiliza `setAppointmentStatus`) e `feat_data03` (conversores de
`Timestamp`)
**Fornece:** `listAppointmentsForBusiness` — reutilizado por `feat_data10`

---

## Objetivo

Listar os agendamentos do dia, de todos os profissionais juntos, e registrar o resultado do
atendimento.

## O que muda no código

Só `appointments/services/appointmentService.ts`:

```ts
export async function listAppointmentsForBusiness(
  businessId: string,
  dayStart: Date,
  dayEnd: Date,
): Promise<Appointment[]>
```

A consulta passa a filtrar o dia **no servidor** (`where start >= dayStart`, `where start < dayEnd`)
em vez de baixar tudo e filtrar em memória como o mock fazia — a agenda de um salão cresce sem
limite ao longo dos meses.

Isso muda a assinatura: o hook `useBusinessSchedule` passa a repetir a consulta quando a data
muda, em vez de filtrar a lista já carregada.

`setAppointmentStatus` **não é reimplementado** — vem da `feat_data04`. Marcar Realizado, Falta ou
Cancelado aqui usa o mesmo método que o cliente usa para cancelar.

## Regras de segurança

Já coberto pela regra de `appointments` da `feat_data03`: o empreendimento lê e atualiza quando
`request.auth.uid == businessId` (o próprio caminho do documento).

## Índices

Composto em `appointments`: `businessId` implícito no caminho + `start`. Como a consulta é dentro
da subcoleção de um empreendimento, basta ordenar por `start` — índice automático de campo único.

## Remoção do mock

Nada a remover aqui: `mockAppointments` já sai na `feat_data03`.

## Critério de pronto

- [ ] A agenda mostra os agendamentos do dia escolhido, de todos os profissionais
- [ ] Trocar a data dispara nova consulta e traz o dia certo
- [ ] Marcar Realizado/Falta/Cancelado persiste
- [ ] Agendamento marcado como Falta ou Cancelado libera o horário na `feat_data03` (RN07)
- [ ] Um empreendimento não consegue ler a agenda de outro (testar com duas contas)
