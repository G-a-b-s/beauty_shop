# feat_data04 — Meus agendamentos

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot04`](../prototype/feat_prot04-Meus-agendamentos.md)
**Depende de:** `feat_data03` (conversores de `Timestamp` e formato do agendamento)
**Fornece:** `listAppointmentsForCustomer`, `setAppointmentStatus` — este último **reutilizado**
por `feat_data09`

---

## Objetivo

Listar os agendamentos do cliente logado **através de vários empreendimentos** e permitir
cancelar.

## O desafio desta feature: consulta entre empreendimentos

Os agendamentos vivem em subcoleções, um por empreendimento
(`businesses/{businessId}/appointments`). O cliente precisa ver todos de uma vez, sem saber em
quais empreendimentos já agendou. A solução é uma consulta **`collectionGroup`**:

```ts
query(collectionGroup(db, 'appointments'), where('customerId', '==', customerId))
```

É exatamente o caso que justificou copiar `businessName` para dentro do agendamento
(`docs/arquitetura.md`): sem isso, exibir a lista exigiria uma leitura extra por empreendimento
distinto.

## O que muda no código

Em `appointments/services/appointmentService.ts`:

| Método | Consulta |
|---|---|
| `listAppointmentsForCustomer(customerId)` | `collectionGroup('appointments')` + `where customerId ==` + `orderBy start desc` |
| `setAppointmentStatus(appointment, status)` | `writeBatch`: `update` do status no agendamento + `delete` do slot em `busySlots` |

O mapeamento é explícito: o `businessId` vem do caminho (`snapshot.ref.parent.parent.id`), não da
cópia gravada, e `start`/`end` voltam a string ISO com `toDate`.

`setAppointmentStatus` recebe `Pick<Appointment, 'id' | 'businessId' | 'professionalId' | 'start'>`:
são os dados necessários para montar os dois caminhos do batch, todos já carregados pela tela.

`cancelAppointment` deixa de existir como método próprio: vira
`setAppointmentStatus(appointment, 'cancelled')`, que a `feat_data09` também usa para marcar
realizado/falta. Um método, dois consumidores.

A separação Próximos/Histórico continua no hook — é derivação de dado já carregado, não vale uma
segunda consulta.

### Exceção: o hook muda

Como na `feat_data03` e na `feat_data05`, o `useCustomerAppointments` não fica intacto:

- `cancel(appointmentId)` mantém a assinatura para o componente, mas procura o agendamento no
  próprio estado e passa o objeto ao `setAppointmentStatus`.
- O parâmetro `customerName` sai do hook e do `listAppointmentsForCustomer`: só servia ao seed do
  mock. Por isso a chamada em `CustomerAppointmentsScreen` perde o segundo argumento — a única
  linha alterada em `components/`.

### Ponte temporária até a `feat_data09`

A agenda do empreendimento ainda lê o mock (`listAppointmentsForBusiness` migra na 09). Para os
botões Realizado/Falta continuarem funcionando sobre esses dados, o `useBusinessSchedule` passa a
chamar `setMockAppointmentStatus(appointmentId, status)`, com o comportamento antigo. Ele sai na
`feat_data09`, que troca a chamada pelo `setAppointmentStatus` desta feature.

## Regras de segurança

> **A regra da `feat_data03` NÃO cobre esta consulta.** Um bloco
> `match /businesses/{businessId}/appointments/{id}` vale apenas para acesso por **caminho
> conhecido**. Consulta `collectionGroup` é avaliada contra um bloco que case com o **grupo de
> coleção**, independente do pai — sem ele, a consulta é recusada mesmo com a regra aninhada
> permitindo. É o erro mais comum ao introduzir `collectionGroup`.

Acrescenta um bloco próprio:

```
match /{path=**}/appointments/{appointmentId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.customerId;
}
```

Três detalhes que fazem isso ser seguro e suficiente:

- As regras são **somadas** (basta um bloco permitir). Este bloco só acrescenta "o cliente lê os
  próprios agendamentos".
- Com `rules_version = '2'`, o `{path=**}` também casa com o caminho conhecido
  `businesses/{businessId}/appointments/{id}`. Por isso a leitura por caminho conhecido **não** é
  repetida no bloco aninhado: seria uma segunda permissão idêntica.
- A consulta **precisa** filtrar por `customerId`; sem esse `where`, o Firestore recusa, porque não
  consegue garantir que todo documento retornado satisfaz a regra. O isolamento vem daí.

### O cancelamento

Cancelar é escrita por **caminho conhecido** (o `businessId` vem do próprio documento lido). A
`feat_data03` só liberou `create` em `appointments`; esta feature acrescenta ao mesmo bloco o
`update` do cliente, e o `delete` do slot de `busySlots`
([ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md)):

```
match /businesses/{businessId}/appointments/{appointmentId} {
  // ... create da feat_data03

  function busySlotPath(data) {
    return /databases/$(database)/documents/businesses/$(businessId)/professionals/$(data.professionalId)/busySlots/$(string(data.start.toMillis()));
  }

  // Só o status muda, só a partir de 'scheduled', e o slot sai no mesmo batch.
  function isStatusChange(allowed) {
    return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
      && resource.data.status == 'scheduled'
      && request.resource.data.status in allowed
      && !existsAfter(busySlotPath(resource.data));
  }

  allow update: if request.auth != null
                && request.auth.uid == resource.data.customerId
                && resource.data.start > request.time                    // RF09: só futuro
                && isStatusChange(['cancelled']);
}

match /businesses/{businessId}/professionals/{professionalId}/busySlots/{slotId} {
  // ... read e create da feat_data03

  // O slot só sai quando o agendamento dele deixa de estar 'scheduled' no mesmo batch.
  // Quem pode mudar o status é decidido pela regra de appointments.
  allow delete: if request.auth != null
                && getAfter(/databases/$(database)/documents/businesses/$(businessId)/appointments/$(resource.data.appointmentId)).data.status != 'scheduled';
}
```

Ela só deixa o cliente:

- mudar **apenas** o campo `status`;
- de `'scheduled'` para `'cancelled'` — nunca para `'completed'` ou `'noShow'`;
- em agendamento **futuro** (RF09);
- apagando o slot no mesmo `writeBatch`, para o horário voltar a ficar livre.

Ou seja, mesmo com `setAppointmentStatus` sendo um método genérico, o cliente não consegue usá-lo
para marcar o próprio atendimento como realizado, reabrir um cancelado ou mudar horário.

O `setAppointmentStatus` precisa de `businessId`, `professionalId` e `start` do agendamento para
montar os dois caminhos do batch — todos vêm do documento já lido pela tela.

## Índices

Índice de **grupo de coleção** — o Firestore não cria automaticamente. Em `firestore.indexes.json`:

```json
{
  "collectionGroup": "appointments",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "customerId", "order": "ASCENDING" },
    { "fieldPath": "start", "order": "DESCENDING" }
  ]
}
```

O `queryScope: "COLLECTION_GROUP"` é obrigatório: o padrão (`COLLECTION`) gera um índice que **não**
serve para `collectionGroup`, e o sintoma é um erro em tempo de execução com um link para criar o
índice certo.

## Remoção do mock

`seedAppointmentsForCustomer` sai do `mockDb.ts`: o `listAppointmentsForCustomer` era o único
consumidor. `mockAppointments` fica até a `feat_data11` (ver o cronograma em
[`README.md`](README.md#remoção-do-mock)).

## Critério de pronto

- [x] Lista traz agendamentos de mais de um empreendimento
- [x] Nomes exibidos vêm dos campos denormalizados, sem leitura extra
- [x] Cancelar atualiza o status e move o item para o Histórico
- [x] Horário cancelado volta a aparecer como livre na `feat_data03` (RN07, agora de verdade)
- [x] Um cliente não consegue ler agendamento de outro (testar com duas contas)
- [x] Pelo console, o cliente não consegue cancelar agendamento passado, marcar como realizado/falta
      nem alterar outro campo além de `status`

Verificado em 16/11/2026: tela via Playwright (Cliente Tela com agendamentos em 2 empreendimentos,
cancelamento indo para o Histórico, horário voltando a ficar livre, agendamento passado no
Histórico sem botão de cancelar) e script de regras com duas contas, 13/13 verificações OK.
