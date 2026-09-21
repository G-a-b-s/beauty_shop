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

Só `appointments/services/appointmentService.ts`:

| Método | Consulta |
|---|---|
| `listAppointmentsForCustomer` | `collectionGroup('appointments')` + `where customerId ==` |
| `setAppointmentStatus` | `updateDoc` no agendamento |

`cancelAppointment` deixa de existir como método próprio: vira `setAppointmentStatus(id, 'cancelled')`,
que a `feat_data09` também usa para marcar realizado/falta. Um método, dois consumidores.

A separação Próximos/Histórico continua no hook — é derivação de dado já carregado, não vale uma
segunda consulta.

## Regras de segurança

> **A regra da `feat_data03` NÃO cobre esta consulta.** Um bloco
> `match /businesses/{businessId}/appointments/{id}` vale apenas para acesso por **caminho
> conhecido**. Consulta `collectionGroup` é avaliada contra um bloco que case com o **grupo de
> coleção**, independente do pai — sem ele, a consulta é recusada mesmo com a regra aninhada
> permitindo. É o erro mais comum ao introduzir `collectionGroup`.

Acrescenta um bloco próprio:

```
match /{path=**}/appointments/{appointmentId} {
  allow read: if request.auth.uid == resource.data.customerId;
}
```

Dois detalhes que fazem isso ser seguro:

- As regras são **somadas** (basta um bloco permitir). Este bloco só acrescenta "o cliente lê os
  próprios agendamentos" — permissão que a regra aninhada já concedia por outro caminho.
- A consulta **precisa** filtrar por `customerId`; sem esse `where`, o Firestore recusa, porque não
  consegue garantir que todo documento retornado satisfaz a regra. O isolamento vem daí.

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

Nada a remover aqui: `mockAppointments` já sai na `feat_data03`.

## Critério de pronto

- [ ] Lista traz agendamentos de mais de um empreendimento
- [ ] Nomes exibidos vêm dos campos denormalizados, sem leitura extra
- [ ] Cancelar atualiza o status e move o item para o Histórico
- [ ] Horário cancelado volta a aparecer como livre na `feat_data03` (RN07, agora de verdade)
- [ ] Um cliente não consegue ler agendamento de outro (testar com duas contas)
