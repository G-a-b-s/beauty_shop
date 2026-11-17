# feat_data03 — Novo agendamento

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot03`](../prototype/feat_prot03-Novo-agendamento.md)
**Depende de:** `feat_data02` (reutiliza `listServicesForBusiness` e `listProfessionalsForBusiness`)
**Fornece:** conversores de `Timestamp` em `shared/lib/firestore.ts`, `listShiftsForProfessional`,
`listTimeOffForProfessional`, `listBusySlotsForProfessional`, `createAppointment`
**Decisão estruturante:** [ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md) (projeção dos
horários ocupados)

---

## Objetivo

Ligar o cálculo de disponibilidade e a criação do agendamento ao Firestore. A feature mais
sensível do pacote: é ela que introduz **escrita** e o tratamento de data/hora.

## O que muda no código

**A função de disponibilidade continua pura.** `appointments/domain/availability.ts` recebe
valores — não sabe se vieram de mock ou do Firestore. Duas mudanças no `domain/`:

- A verificação de sobreposição (RN01) sai de dentro de `availability.ts` para
  `appointments/domain/conflict.ts` (`overlaps`, `hasConflict`), como previsto em
  `docs/arquitetura.md`, e ganha teste automatizado (`conflict.test.ts`, `npm test`).
- `getAvailableSlots` passa a receber `busySlots: TimeRange[]` (só intervalos ocupados) em vez de
  `appointments: Appointment[]`, porque o cliente não lê mais agendamentos — ver
  [ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md).

### Exceção: o hook muda

Como na `feat_data05`, o `useBookAppointment` não fica intacto:

- Os três métodos de leitura passam a receber `businessId`. Os documentos vivem dentro de
  `businesses/{businessId}` e não há caminho até eles só com o id do profissional. O hook já tinha
  o `businessId` (vem da rota).
- O estado `appointments` vira `busySlots`, alimentado por `listBusySlotsForProfessional`.

### Ajuste de tela: calendário no lugar da lista de 14 dias

Decidido durante os testes de tela (16/11/2026). A escolha da data era uma fileira de 14 botões
("seg., 16/11"…), o que limitava o agendamento a duas semanas e mostrava dias sem horário. Passou a
ser um calendário mensal:

- Componente novo `shared/ui/MonthCalendar.tsx`: mês com setas, dias fora da janela ou sem horário
  livre aparecem apagados e não são clicáveis. Não instala biblioteca.
- No hook: `availableDates` sai; entram `visibleMonth`, `goToPreviousMonth`/`goToNextMonth`,
  `canGoToPreviousMonth`/`canGoToNextMonth` e `isDateBookable`. Um dia é agendável se está entre
  hoje e **60 dias à frente** (`BOOKING_WINDOW_DAYS`) e `getAvailableSlots` devolve ao menos um
  horário. Shifts, folgas e slots já vinham numa leitura só por profissional, então apagar os dias
  não custa leitura extra.
- `shared/lib/date.ts` ganha `getMonthGrid` (grade de 42 dias, reaproveitada pelas agendas do
  empreendimento e do profissional) e `isSameMonth`; `formatDayLabel` saiu por não ter mais uso.
- `shared/lib/text.ts` ganha `capitalizeFirst`: o `capitalize` do CSS escrevia "Novembro De 2026".

Fora esse ajuste, `components/` não muda.

### Teste automatizado

`npm test` roda `node --test` sobre `src/**/*.test.ts`, com o test runner nativo do Node (≥ 22.18,
que executa TypeScript sem compilar). Nenhuma dependência nova. Os arquivos `*.test.ts` saem do
`tsconfig.app.json` e entram no `tsconfig.node.json`, que conhece os tipos do Node.

### Novo: conversores de data (`shared/lib/firestore.ts`)

O Firestore guarda data como `Timestamp`, o domínio trabalha com `Date`. Um par de conversores
usado por toda feature que lê ou grava agendamento:

```ts
export function toDate(value: Timestamp): Date
export function toTimestamp(value: Date): Timestamp
```

Consumido depois por `feat_data04`, `09`, `10` e `11` — **não reimplementar**.

### `appointments/services/appointmentService.ts`

| Método | Consulta |
|---|---|
| `listShiftsForProfessional(businessId, professionalId)` | `getDoc` no profissional, lê `shifts[]` |
| `listTimeOffForProfessional(businessId, professionalId)` | `businesses/{businessId}/professionals/{uid}/timeOff`; o `professionalId` vem do caminho |
| `listBusySlotsForProfessional(businessId, professionalId)` | `businesses/{businessId}/professionals/{uid}/busySlots`, `where end > agora` |
| `createAppointment` | `writeBatch`: agendamento em `businesses/{businessId}/appointments` + slot em `busySlots` |

Os intervalos ocupados vêm da projeção `busySlots`, e não de `appointments`: a regra de leitura de
agendamento não deixa o cliente ler agendamento de outro cliente, e regra de segurança não filtra
resultado — a consulta seria negada por inteiro. Detalhes no
[ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md).

O filtro é `end > agora`, e não `start >= agora`: um atendimento em andamento ainda bloqueia o
restante do seu intervalo. Só existe slot de agendamento `scheduled` (RN07), então não há filtro de
status. Consulta de campo único — sem índice composto.

`listAppointmentsForProfessional` **não** é migrado aqui: deixou de ser usado pelo novo
agendamento e passa a ser fornecido pela `feat_data11`, sua única consumidora.

O tipo `Appointment` mantém `start`/`end` como string ISO; o service converte com `toDate` /
`toTimestamp`. Assim as telas das features 04, 09, 10 e 11 não mudam por causa do tipo.

### Denormalização na escrita

`createAppointment` grava a cópia histórica de `businessName`, `professionalName`, `customerName`,
`serviceName` e `durationMinutes`, conforme `docs/arquitetura.md`. O hook passa só ids (e o
`customerName`, da sessão), então o service **lê** empreendimento, profissional e serviço antes de
gravar — três leituras por agendamento. Em troca, os nomes e a duração estão sempre atualizados no
momento da gravação, o que reduz recusas da regra por cópia desatualizada.

A regra de segurança abaixo **confere** essas cópias contra os documentos de origem no momento da
criação. O `customerName` vem da sessão, que a `feat_data05` atualiza ao salvar o perfil.

O documento gravado tem exatamente estes campos: `businessId`, `customerId`, `professionalId`,
`serviceId`, `businessName`, `professionalName`, `customerName`, `serviceName`,
`durationMinutes`, `start`, `end`, `status` (sempre `'scheduled'`) e, opcionalmente, `note`.

## Regras de negócio

RN01 a RN12 continuam no `domain/`, validadas no cliente — é lá que a tela decide o que oferecer.
Sem backend, porém, a validação do cliente não protege nada (`docs/arquitetura.md`, seção 6). Por
isso a regra de segurança **repete** as regras de agendamento que conseguem ser verificadas com os
dados de um único documento:

| Regra | Verificada pela regra de segurança? | Como |
|---|---|---|
| RN04 serviço do profissional | sim | `serviceId in professional.serviceIds` |
| RN06 data no passado | sim | `start > request.time` |
| RN08 apenas ativos | sim | `active == true` no profissional, no serviço e no empreendimento |
| RN09 mesmo empreendimento | sim, estruturalmente | profissional e serviço são lidos **dentro** de `businesses/{businessId}`; se forem de outro empreendimento, o `get()` não encontra o documento e a escrita é negada |
| Duração e `end` | sim | `durationMinutes` igual ao do serviço; `end == start + durationMinutes` |
| Cópias denormalizadas | sim | nomes iguais aos dos documentos de origem |
| RN01 sobreposição | **em parte** | o id do slot é o início: mesmo início para o mesmo profissional é recusado ([ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md)). Sobreposição com início diferente não — exigiria consulta |
| RN02, RN05 dentro da jornada | **não** | depende do dia da semana e do horário no fuso local, que a regra não calcula de forma confiável |
| RN03 folga | **não** | folga tem id gerado; achar a da data exigiria consulta |

O que fica só no cliente é **risco conhecido e aceito no escopo do protótipo**: um
cliente mal-intencionado, pelo console, consegue marcar um horário parcialmente sobreposto ou fora da jornada,
mas não consegue marcar com profissional de outro salão, serviço inativo, data passada, duração ou
nomes adulterados. Fechar o restante exigiria backend (Cloud Function com transação), o que
contraria o [ADR 0002](../../adr/0002-persistencia.md).

Esta é a feature indicada para o **TDD pontual** previsto no `METODOLOGIA.md`: `availability.ts` é
função pura com muitos casos de borda.

## Regras de segurança

Cada feature acrescenta só a permissão de que precisa. A `feat_data03` acrescenta:

- `appointments`: só `create`. Leitura e `update` entram com quem os usa — `feat_data04` (cliente
  lê os seus e cancela), `feat_data09` (empreendimento lê e registra resultado) e `feat_data11`
  (profissional lê). Sem `delete` (nenhuma regra o libera).
- `busySlots`: `read` por conta autenticada e `create` conferido contra o agendamento. O `delete`
  entra na `feat_data04`/`feat_data09`, junto com a mudança de status.
- `timeOff`: só `read`. A escrita entra na `feat_data12`, já desmembrada em `create`/`delete` com
  validação — não com `write` genérico.

O trecho está no [`firestore.rules`](../../../firestore.rules):

```
match /businesses/{businessId}/professionals/{professionalId}/timeOff/{timeOffId} {
  allow read: if request.auth != null;
}

match /businesses/{businessId}/professionals/{professionalId}/busySlots/{slotId} {
  function isValidNewBusySlot(data) {
    let appointment = getAfter(/databases/$(database)/documents/businesses/$(businessId)/appointments/$(data.appointmentId)).data;

    return data.keys().hasOnly(['appointmentId', 'start', 'end'])
      && data.keys().hasAll(['appointmentId', 'start', 'end'])
      && data.start is timestamp
      && slotId == string(data.start.toMillis())
      && appointment.customerId == request.auth.uid
      && appointment.professionalId == professionalId
      && appointment.status == 'scheduled'
      && appointment.start == data.start
      && appointment.end == data.end;
  }

  allow read: if request.auth != null;
  allow create: if request.auth != null && isValidNewBusySlot(request.resource.data);
}

match /businesses/{businessId}/appointments/{appointmentId} {
  function docAt(path) {
    return get(path).data;
  }

  function isValidNewAppointment(data) {
    let business = docAt(/databases/$(database)/documents/businesses/$(businessId));
    let professional = docAt(/databases/$(database)/documents/businesses/$(businessId)/professionals/$(data.professionalId));
    let offeredService = docAt(/databases/$(database)/documents/businesses/$(businessId)/services/$(data.serviceId));
    let customer = docAt(/databases/$(database)/documents/customers/$(request.auth.uid));
    let account = docAt(/databases/$(database)/documents/users/$(request.auth.uid));
    let required = ['businessId', 'customerId', 'professionalId', 'serviceId', 'businessName',
                    'professionalName', 'customerName', 'serviceName', 'durationMinutes',
                    'start', 'end', 'status'];

    return account.type == 'customer'
      && data.keys().hasAll(required)
      && data.keys().hasOnly(required.concat(['note']))
      && (!('note' in data) || (data.note is string && data.note.size() <= 500))
      && data.businessId == businessId
      && data.customerId == request.auth.uid
      && data.status == 'scheduled'
      && data.start is timestamp
      && data.start > request.time                                        // RN06
      && business.active == true
      && professional.active == true                                      // RN08
      && offeredService.active == true                                    // RN08
      && data.serviceId in professional.serviceIds                        // RN04
      && data.durationMinutes == offeredService.durationMinutes
      && data.end == data.start + duration.value(data.durationMinutes, 'm')
      && data.businessName == business.name
      && data.professionalName == professional.name
      && data.serviceName == offeredService.name
      && data.customerName == customer.name
      && existsAfter(/databases/$(database)/documents/businesses/$(businessId)/professionals/$(data.professionalId)/busySlots/$(string(data.start.toMillis())));
  }

  allow create: if request.auth != null && isValidNewAppointment(request.resource.data);
}
```

Detalhes que sustentam esse bloco:

- **Custo das leituras.** A criação do agendamento faz 5 `get()` (conta, empreendimento,
  profissional, serviço, cliente) e 1 `existsAfter()`; a do slot, 1 `getAfter()`. O limite é 10
  por documento e 20 por batch, e cada acesso é cobrado como uma leitura.
- **`get()` de documento inexistente falha a regra**, em vez de devolver vazio. É isso que torna a
  RN09 estrutural: não existe caminho válido para um profissional de outro empreendimento.
- **Agendamento e slot se conferem.** O agendamento só é aceito se o slot existir ao fim do batch;
  o slot só é aceito se o agendamento existir, for do mesmo cliente e profissional, estiver
  `scheduled` e tiver o mesmo intervalo. Nenhum dos dois nasce sozinho.
- **Mesmo horário, dois clientes.** O id do slot é o início em milissegundos. Se já existe, o
  `set` do segundo cliente é avaliado como `update`, que não é permitido, e o batch inteiro falha.
- **`account.type == 'customer'`** impede que uma conta de empreendimento ou de profissional crie
  agendamento em nome próprio — sem isso, bastaria ela ter um documento em `customers/{uid}`.

## Índices

Nenhum composto. `busySlots` é consultado por faixa de `end` (campo único, automático) e `timeOff`
é lido inteiro.

O índice `professionalId` + `status` + `start` previsto antes do
[ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md) deixou de existir.

## Remoção do mock

`mockBusinesses` sai do `mockDb.ts`: o `createAppointment` era o último consumidor (os outros,
`listBusinesses` e `getBusinessById`, migraram na `feat_data01` e na `feat_data02`). Com ele, o
tipo `Business` passa a ser definido em `businesses/types.ts`.

`mockAppointments`, `mockTimeOff`, `mockProfessionals` e `mockServices` **ficam**: ainda têm
consumidores em features seguintes. Ver o cronograma em [`README.md`](README.md#remoção-do-mock).

## Critério de pronto

- [x] Horários livres calculados sobre jornada, folga e horários ocupados reais
- [x] Confirmar grava o agendamento e o slot no Firestore e navega para "Meus agendamentos"
- [x] O horário recém-agendado some da lista de livres
- [x] RN01 coberta por teste automatizado (`npm test`)
- [x] Calendário mensal: dias passados, sem jornada, de folga ou além de 60 dias ficam apagados
- [x] A regra de segurança recusa um agendamento com: status diferente de `'scheduled'`, data
      passada, profissional ou serviço de outro empreendimento, profissional ou serviço inativo,
      serviço que o profissional não executa, duração ou `end` divergentes do serviço, nomes
      denormalizados adulterados, `customerId` de outra conta, criado por conta que não é de
      cliente, ou sem o slot correspondente
- [x] A regra recusa um segundo agendamento com o mesmo profissional e o mesmo início

Verificado em 16/11/2026: tela via Playwright (Cliente Tela; Ana com folga em 10/12, 20/11 sem 10h,
domingos e dias passados apagados, janela até 14/01/2027) e script de regras com 17/17 casos OK.
