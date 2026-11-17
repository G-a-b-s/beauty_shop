# ADR 0012 — Projeção dos horários ocupados, sem dados de cliente

**Data:** 2026-11-07
**Status:** Aceito
**Relacionado:** [ADR 0002](0002-persistencia.md) (sem backend) ·
[ADR 0004](0004-multi-tenancy-e-autenticacao.md) (isolamento por empreendimento)

---

## Contexto

Para oferecer horários livres na [`feat_data03`](../features/data/feat_data03-Novo-agendamento.md),
o cliente precisa saber quais intervalos do profissional já estão ocupados — inclusive por
agendamentos de **outros clientes**.

O desenho original lia esses intervalos direto de `businesses/{businessId}/appointments`. Só que a
regra de leitura dessa coleção libera o documento apenas para o empreendimento, o cliente dono e o
profissional. No Firestore, regra de segurança não filtra resultado: uma consulta que **pode**
devolver documento proibido é negada por inteiro. A consulta do cliente falharia com
`permission-denied`.

O Firestore também não tem permissão por campo: quem pode ler um agendamento lê todos os campos,
incluindo `customerName` e `customerId`.

---

## Decisão

Criar a subcoleção **`businesses/{businessId}/professionals/{professionalId}/busySlots/{slotId}`**,
uma projeção dos agendamentos `scheduled` com só o necessário para calcular disponibilidade:

| Campo | Tipo |
|---|---|
| `appointmentId` | string — o agendamento que originou o intervalo |
| `start` | timestamp |
| `end` | timestamp |

- **Id do documento = início em milissegundos** (`String(start.getTime())`).
- **Leitura:** qualquer conta autenticada. Não há dado pessoal.
- **Criação:** só no mesmo `writeBatch` que cria o agendamento. As regras se conferem
  mutuamente — o agendamento exige `existsAfter` do slot; o slot confere, com `getAfter`, que o
  agendamento existe, é do mesmo cliente e profissional, está `scheduled` e tem o mesmo
  `start`/`end`.
- **Remoção:** quando o agendamento deixa de ser `scheduled` (cancelamento na `feat_data04`,
  resultado registrado na `feat_data09`), o slot é apagado no mesmo batch da mudança de status.
  A RN07 (só `scheduled` bloqueia) passa a ser garantida pela própria existência do slot.
- **Consulta:** `where end > agora`, índice automático de campo único. Filtrar por `end` (e não
  por `start`) mantém bloqueado o restante de um atendimento em andamento.

---

## Consequências

### Positivas

- Nenhum dado de cliente fica legível por outras contas, preservando o isolamento do ADR 0004.
- **Fecha parte da RN01 no servidor.** Como o id é o início, dois clientes que escolhem o mesmo
  horário ao mesmo tempo não conseguem ambos gravar: o segundo `set` vira `update`, que a regra
  não permite, e o batch inteiro falha.
- A consulta da `feat_data03` dispensa índice composto.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| Sobreposição parcial com início diferente (serviços de durações diferentes) continua possível por quem burlar o cliente | Risco aceito, já registrado na `feat_data03`; fechar exigiria transação em backend |
| Duas escritas por agendamento e uma por mudança de status | Atômicas por `writeBatch`; custo irrelevante na escala do estudo |
| A `feat_data04` e a `feat_data09` precisam apagar o slot ao mudar o status | Registrado nos documentos das duas features, com a regra de `delete` correspondente |
| Slot órfão, se alguém mudar status pelo console sem apagar o slot | A regra de `update` de `appointments` (04/09) só aceita a transição se o slot for apagado no mesmo batch (`!existsAfter`) |

---

## Alternativas consideradas

**Liberar leitura de `appointments` para qualquer conta autenticada.** Mais simples e sem coleção
nova. Rejeitada: expõe nome e id de todos os clientes a qualquer conta logada, inclusive a
empreendimentos concorrentes.

**Cloud Function que devolve só os intervalos.** Rejeitada pelo ADR 0002 (sem backend).

**Documento único por profissional com a lista de intervalos.** Rejeitada: lista ilimitada dentro
de documento (mesmo motivo que levou `timeOff` para subcoleção) e disputa de escrita entre clientes.
