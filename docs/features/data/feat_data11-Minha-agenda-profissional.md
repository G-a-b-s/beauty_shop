# feat_data11 — Minha agenda (profissional)

**Conta:** Profissional
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot11`](../prototype/feat_prot11-Minha-agenda-profissional.md)
**Depende de:** `feat_data03` (os conversores de `Timestamp`) e
`feat_data00` (a sessão do profissional traz `businessId`)
**Fornece:** `listAppointmentsForProfessional` (migrado aqui, não na `feat_data03` — ver
[ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md))

---

## Objetivo

Mostrar ao profissional os próprios agendamentos, nas visões de dia, semana e mês.

## O que muda no código

`listAppointmentsForProfessional` é migrado aqui. A `feat_data03` deixou de usá-lo: o novo
agendamento lê os horários ocupados da projeção `busySlots`
([ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md)). O método ainda lê o mock, e esta é a
única tela que o consome. Três pontos:

### 1. O caminho precisa do `businessId`

O agendamento vive em `businesses/{businessId}/appointments`. O profissional só conhece o próprio
`uid` — o `businessId` vem de `users/{uid}`, carregado na sessão pela `feat_data00` e exposto por
`useCurrentBusinessId`. Nenhuma leitura extra.

### 2. Sem filtro de `status`

A agenda do profissional mostra **todos** os status (o que foi realizado, a falta, o cancelado),
então a consulta não filtra `status`:

```ts
listAppointmentsForProfessional(businessId, professionalId, periodStart, periodEnd)
```

### 3. Recorte por período

A visão de mês carrega 42 dias de grade. A consulta passa a receber `periodStart`/`periodEnd` e
filtrar no servidor, recarregando ao navegar entre períodos — em vez de baixar o histórico inteiro
do profissional.

### Como ficou na implementação

Mesmo desenho do `useBusinessSchedule` da `feat_data09`: o `useProfessionalAgenda` recebe
`businessId` e `professionalId` (o `ProfessionalAgendaScreen` usa `useCurrentBusinessId`), consulta
o período visível (dia, semana ou grade de 42 dias do mês), refaz a consulta ao navegar e descarta
respostas atrasadas (`ignore`).

## Isolamento

A consulta filtra por `professionalId == uid` da sessão. Um profissional não alcança agendamento de
colega, nem que altere a URL — a regra de segurança recusa.

## Regras de segurança

Acrescenta ao bloco de `appointments` só a leitura do profissional:

```
match /businesses/{businessId}/appointments/{appointmentId} {
  // ... regras das feat_data03, 04 e 09
  allow read: if request.auth != null && request.auth.uid == resource.data.professionalId;
}
```

A consulta filtra `professionalId == uid`; sem esse `where`, o Firestore recusa.

> Como a consulta é dentro da subcoleção do empreendimento (caminho conhecido), não precisa de
> `collectionGroup` — diferente da `feat_data04`, onde o cliente cruza empreendimentos.

## Índices

Composto em `appointments`: `professionalId` ASC + `start` ASC, escopo **coleção** (já previsto em
`docs/arquitetura.md`). Registrado em `firestore.indexes.json`.

## Remoção do mock

`mockAppointments` sai do `mockDb.ts`: o `listAppointmentsForProfessional` era o último consumidor.
Os tipos `Appointment` e `AppointmentStatus` passam para `shared/types/appointment.ts`. Saem
junto os helpers que só montavam esse mock (`daysAgo`, `daysAhead`, `atTime`); no `mockDb.ts` fica
apenas o `mockTimeOff`, até a `feat_data12`.

## Critério de pronto

- [x] As três visões (dia/semana/mês) mostram agendamentos reais
- [x] Navegar para período anterior/seguinte recarrega o recorte certo
- [x] Clicar num dia no mês abre a visão de dia daquela data
- [x] Agendamentos realizados, faltas e cancelados aparecem (não só os agendados)
- [x] Um profissional não vê agendamento de outro do mesmo empreendimento (testar com duas contas)

Verificado em 16/11/2026. Tela via Playwright: Fábio vê os 4 de 17/11 (falta e cancelados) no Dia
e na Semana, o Mês marca 1 em 10/11 e 4 em 17/11, outubro vem vazio, clicar no dia 10 abre o Dia
com o realizado; Gabi vê só o dela (17/11 15h). Script de regras com 6/6 verificações OK (cada um
lista os próprios; Gabi não lista os do Fábio, nem a agenda sem filtro, nem lê um pelo caminho;
profissional não altera status).

### Ajuste de tela feito junto

A visão Dia não exibia o status de cada agendamento, embora o `feat_prot11` previsse. Passou a
exibir, com o mapa de rótulos extraído para `appointments/components/statusLabels.ts` e reusado
pelas telas do cliente, do empreendimento e do profissional (antes repetido em duas delas).
