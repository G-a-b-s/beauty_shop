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

Na implementação, a faixa é o **período visível** e não só um dia: a tela tem as visões Dia,
Semana e Mês (`ScheduleView`), então o hook consulta do primeiro ao último dia mostrado
(`rangeStart`/`rangeEnd`) e repete a consulta ao trocar de período ou de visão. Uma resposta
atrasada de um período anterior é descartada (`ignore` no `useEffect`), para não sobrescrever o
atual. O hook espera o `businessId` chegar antes de consultar.

`setAppointmentStatus` **não é reimplementado** — vem da `feat_data04`. Marcar Realizado, Falta ou
Cancelado aqui usa o mesmo método que o cliente usa para cancelar. O `useBusinessSchedule` troca a
ponte temporária `setMockAppointmentStatus(appointmentId, status)` (criada na `feat_data04`) por
`setAppointmentStatus(appointment, status)`, procurando o agendamento no próprio estado, e a ponte
sai do service.

## Regras de segurança

Acrescenta ao bloco de `appointments` (criação da
[`feat_data03`](feat_data03-Novo-agendamento.md#regras-de-segurança), leitura e cancelamento do
cliente e a função `isStatusChange` da [`feat_data04`](feat_data04-Meus-agendamentos.md#o-cancelamento))
a leitura e o `update` do empreendimento:

```
match /businesses/{businessId}/appointments/{appointmentId} {
  // ... create da feat_data03, read/update do cliente e isStatusChange da feat_data04

  allow read: if request.auth != null && request.auth.uid == businessId;
  allow update: if request.auth != null && request.auth.uid == businessId
                && isStatusChange(['completed', 'noShow', 'cancelled']);
}
```

- só o campo `status` muda — horário, cliente, profissional e nomes copiados são imutáveis;
- só a partir de `'scheduled'`, para `'completed'`, `'noShow'` ou `'cancelled'`. Um agendamento
  já finalizado não volta a ficar em aberto nem troca de resultado;
- o slot de `busySlots` é apagado no mesmo `writeBatch` ([ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md)).
  O `delete` do slot já foi liberado pela `feat_data04` para qualquer mudança de status válida —
  nada a acrescentar em `busySlots`.

É a mesma restrição que a tela já aplica ao mostrar as ações só enquanto o status é `'scheduled'`
(`feat_prot09`), agora garantida também no servidor.

## Índices

Nenhum composto. O empreendimento já está no caminho da subcoleção e a consulta filtra só por
faixa de `start` — o índice automático de campo único atende.

## Remoção do mock

Nada a remover aqui: `mockAppointments` fica até a `feat_data11`, que migra o
`listAppointmentsForProfessional`, último a lê-lo (ver o cronograma em [`README.md`](README.md#remoção-do-mock)).

## Critério de pronto

- [x] A agenda mostra os agendamentos do dia escolhido, de todos os profissionais
- [x] Trocar a data dispara nova consulta e traz o dia certo
- [x] Marcar Realizado/Falta/Cancelado persiste
- [x] Agendamento marcado como Falta ou Cancelado libera o horário na `feat_data03` (RN07)
- [x] Um empreendimento não consegue ler a agenda de outro (testar com duas contas)
- [x] Pelo console, o empreendimento não consegue alterar o status de agendamento já finalizado nem
      outro campo além de `status`

Verificado em 16/11/2026: tela via Playwright no Salão Tela (3 agendamentos do Fábio em 17/11 nas
visões Dia e Semana; 9h Realizado, 10h Falta, 11h Cancelado persistidos; nenhum `busySlot` restante
do Fábio) e script de regras com 12/12 verificações OK (outro empreendimento não lê nem altera; dono
não reabre nem troca status finalizado, não altera outro campo, não deixa de liberar o slot nem usa
status inválido; cliente não marca como realizado).

### Ajustes de tela feitos junto

- Os botões Realizado/Falta/Cancelar ficam desabilitados com "Salvando…" enquanto a gravação
  acontece (levava uns 3 s sem nenhum retorno) e um erro aparece se a gravação falhar.
- O título do período no `ScheduleView` usa `capitalizeFirst` em vez do `capitalize` do CSS
  ("Segunda-Feira, 16 De Novembro" → "Segunda-feira, 16 de novembro"). Vale também para a agenda
  do profissional, que usa o mesmo componente.
