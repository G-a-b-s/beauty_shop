# feat_data11 — Minha agenda (profissional)

**Conta:** Profissional
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot11`](../prototype/feat_prot11-Minha-agenda-profissional.md)
**Depende de:** `feat_data03` (`listAppointmentsForProfessional` e os conversores de `Timestamp`) e
`feat_data00` (a sessão do profissional traz `businessId`)
**Fornece:** nada novo

---

## Objetivo

Mostrar ao profissional os próprios agendamentos, nas visões de dia, semana e mês.

## O que muda no código

Quase nada de novo: `listAppointmentsForProfessional` já existe desde a `feat_data03`. Duas
diferenças:

### 1. O caminho precisa do `businessId`

O agendamento vive em `businesses/{businessId}/appointments`. O profissional só conhece o próprio
`uid` — o `businessId` vem de `users/{uid}`, carregado na sessão pela `feat_data00` e exposto por
`useCurrentBusinessId`. Nenhuma leitura extra.

### 2. O filtro de `status` precisa afrouxar

A `feat_data03` criou o método filtrando `status == 'scheduled'`, porque só isso bloqueia horário.
A agenda do profissional precisa mostrar **todos** os status (o que foi realizado, a falta, o
cancelado). O método ganha um parâmetro opcional de status:

```ts
listAppointmentsForProfessional(businessId, professionalId, statuses?: AppointmentStatus[])
```

Sem o parâmetro, traz tudo; a `feat_data03` passa `['scheduled']`. **Um método, dois usos** — em
vez de uma segunda consulta quase idêntica.

### 3. Recorte por período

A visão de mês carrega 42 dias de grade. A consulta passa a receber `periodStart`/`periodEnd` e
filtrar no servidor, recarregando ao navegar entre períodos — em vez de baixar o histórico inteiro
do profissional.

## Isolamento

A consulta filtra por `professionalId == uid` da sessão. Um profissional não alcança agendamento de
colega, nem que altere a URL — a regra de segurança recusa.

## Regras de segurança

A regra de `appointments` da `feat_data03` já contempla:
`request.auth.uid == resource.data.professionalId`.

> Como a consulta é dentro da subcoleção do empreendimento (caminho conhecido), não precisa de
> `collectionGroup` — diferente da `feat_data04`, onde o cliente cruza empreendimentos.

## Índices

Composto em `appointments`: `professionalId` + `start` (já previsto em `docs/arquitetura.md`).

## Remoção do mock

Nada a remover aqui.

## Critério de pronto

- [ ] As três visões (dia/semana/mês) mostram agendamentos reais
- [ ] Navegar para período anterior/seguinte recarrega o recorte certo
- [ ] Clicar num dia no mês abre a visão de dia daquela data
- [ ] Agendamentos realizados, faltas e cancelados aparecem (não só os agendados)
- [ ] Um profissional não vê agendamento de outro do mesmo empreendimento (testar com duas contas)
