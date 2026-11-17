# Pacote 2 — Integração de dados

> Segundo passe do [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md): trocar o
> mock pelo Cloud Firestore, tela por tela. `components/` e `hooks/` **não mudam** — só o arquivo
> em `services/` de cada feature.

---

## Convenção: método compartilhado não se repete

Vários métodos de leitura servem a mais de uma tela. A regra:

> **A primeira feature que precisa de um método o implementa** no `services/` da feature dona
> daquele dado. As features seguintes que precisarem do mesmo método **dependem** dela e apenas o
> consomem — nunca reimplementam nem duplicam a consulta.

Cada documento declara:

- **Depende de** — features cujos métodos ele reutiliza
- **Fornece** — métodos novos que ele deixa disponíveis para as seguintes

## Ordem de implementação

A ordem numérica (`00` → `12`) é uma ordem válida: nenhuma feature depende de outra de número
maior.

## Mapa de dependências

```
feat_data00  Autenticação (base de todas)
  │
  ├── feat_data01  Listagem de empreendimentos
  │     └── feat_data02  Detalhes do empreendimento
  │           ├── feat_data03  Novo agendamento
  │           │     ├── feat_data04  Meus agendamentos
  │           │     │     └── feat_data09  Agenda do empreendimento
  │           │     │           └── feat_data10  Produtividade
  │           │     ├── feat_data11  Minha agenda (profissional)
  │           │     └── feat_data12  Minha jornada e folgas
  │           └── feat_data07  Cadastro/edição de profissional
  │
  ├── feat_data05  Meus dados (cliente)
  ├── feat_data06  Gestão de profissionais ──→ feat_data07
  └── feat_data08  Gestão de serviços
```

## Quem fornece o quê

| Método | Onde mora | Fornecido por | Consumido também por |
|---|---|---|---|
| `subscribeToAccount` / `login` / `signUp` / `logout` | `auth/services/firebaseAuthService.ts` | `feat_data00` | todas |
| `refreshAccount` | `auth/services/firebaseAuthService.ts` | `feat_data05` | — (usar sempre que a própria conta mudar o nome) |
| `getCustomerProfile` / `updateCustomerProfile` | `customers/services/customerService.ts` | `feat_data05` | — |
| `listBusinesses` | `businesses/services/businessService.ts` | `feat_data01` | — |
| `getBusinessById` | `businesses/services/businessService.ts` | `feat_data02` | — |
| `listServicesForBusiness` (só ativos) | `businesses/services/businessService.ts` | `feat_data02` | `feat_data03`, `feat_data07` |
| `listProfessionalsForBusiness` (só ativos) | `businesses/services/businessService.ts` | `feat_data02` | `feat_data03` |
| `toDate` / `toTimestamp` (conversores) | `shared/lib/firestore.ts` | `feat_data03` | `feat_data04`, `feat_data09`, `feat_data10`, `feat_data11` |
| `listShiftsForProfessional` | `appointments/services/appointmentService.ts` | `feat_data03` | `feat_data12` |
| `listTimeOffForProfessional` | `appointments/services/appointmentService.ts` | `feat_data03` | `feat_data10`, `feat_data12` |
| `listBusySlotsForProfessional` | `appointments/services/appointmentService.ts` | `feat_data03` | — |
| `listAppointmentsForProfessional` | `appointments/services/appointmentService.ts` | `feat_data11` | — |
| `createAppointment` | `appointments/services/appointmentService.ts` | `feat_data03` | — |
| `setAppointmentStatus` | `appointments/services/appointmentService.ts` | `feat_data04` | `feat_data09` |
| `listAppointmentsForBusiness` | `appointments/services/appointmentService.ts` | `feat_data09` | `feat_data10` |
| `listProfessionalsByBusiness` (todos) / `setProfessionalActive` | `professionals/services/professionalService.ts` | `feat_data06` | `feat_data07`, `feat_data10` |
| `toProfessional` (conversor, passa a ser exportado) | `businesses/services/businessService.ts` | `feat_data02` | `feat_data06` |
| `createProfessional` / `updateProfessional` | `professionals/services/professionalService.ts` | `feat_data07` | `feat_data12` (só `updateProfessionalShifts`) |
| `getSecondaryAuth` | `shared/lib/secondaryAuth.ts` | `feat_data07` | — |
| `toFriendlyError` (sai do `firebaseAuthService`) | `shared/lib/firebaseErrors.ts` | `feat_data07` | `feat_data00` |
| `firebaseConfig` (passa a ser exportado) | `shared/lib/firebase.ts` | `feat_data07` | — |
| `listServicesByBusiness` (todos) / `createService` / `updateService` / `setServiceActive` | `services-catalog/services/serviceCatalogService.ts` | `feat_data08` | — |
| `toService` (conversor, passa a ser exportado) | `businesses/services/businessService.ts` | `feat_data02` | `feat_data08` |

## Remoção do mock

Cada mock do `mockDb.ts` sai na feature que migra o **último** método que ainda o lê — nunca antes,
senão o build quebra no meio do passe. O tipo que ele exporta muda de lugar na mesma feature: vai
para o `types.ts` da feature quando só ela o usa, ou para `shared/types/` quando é usado por mais
de uma (conforme `docs/arquitetura.md`).

| Mock | Consumidores (feature que migra) | Sai na | Tipo vai para |
|---|---|---|---|
| `mockAccounts` | `mockAuthService` (`00`) | `feat_data00` ✅ | — |
| `mockBusinesses` | `listBusinesses` (`01`), `getBusinessById` (`02`), `createAppointment` (`03`) | `feat_data03` ✅ | `Business` → `businesses/types.ts` |
| `seedAppointmentsForCustomer` | `listAppointmentsForCustomer` (`04`) | `feat_data04` ✅ | — |
| `mockCustomers`, `seedCustomer` | `customerService` (`05`) | `feat_data05` ✅ | `Customer` → `customers/types.ts` |
| `mockProfessionals` | `listProfessionalsForBusiness` (`02`); `listShiftsForProfessional`, `createAppointment` (`03`); `listProfessionalsByBusiness`, `setProfessionalActive` (`06`); `getProfessionalById`, `createProfessional`, `updateProfessional`, `updateProfessionalShifts` (`07`) | `feat_data07` ✅ | `Professional`, `Shift`, `Weekday` → `shared/types/` |
| `mockServices` | `listServicesForBusiness` (`02`); `createAppointment` (`03`); `serviceCatalogService` (`08`) | `feat_data08` ✅ | `Service` → `shared/types/` |
| `mockAppointments` | `createAppointment` (`03`); `listAppointmentsForCustomer`, `setAppointmentStatus`, `cancelAppointment` (`04`); `listAppointmentsForBusiness`, `setMockAppointmentStatus` (ponte temporária criada na `04`) (`09`); `productivityService` (`10`); `listAppointmentsForProfessional` (`11`) | `feat_data11` ✅ | `Appointment`, `AppointmentStatus` → `shared/types/` |
| `mockTimeOff` | `listTimeOffForProfessional` (`03`); `productivityService` (`10`); `listTimeOff`, `addTimeOff`, `removeTimeOff` (`12`) | `feat_data12` ✅ | `TimeOff` → `shared/types/` |

Com o `mockTimeOff`, a `feat_data12` apaga o `mockDb.ts` inteiro. ✅ Apagado em 16/11/2026.

## Regras de segurança do Firestore

São **incrementais**: `feat_data00` cria o arquivo `firestore.rules` com a base (`users`,
`customers`, `businesses`), e cada feature seguinte adiciona a regra da coleção que passa a tocar.
Cada documento tem uma seção "Regras de segurança" com o trecho que ele acrescenta.

Sem backend (ADR 0002), **a regra de segurança é a única barreira real** entre empreendimentos —
a validação de front-end serve à consistência do fluxo, não à segurança.

### Duas armadilhas que valem conhecer antes de escrever a primeira regra

1. **Regras são somadas, nunca subtraídas.** Se dois blocos casam com o mesmo documento, basta um
   permitir. Por isso uma regra restritiva escrita depois **não** limita uma permissiva escrita
   antes — a antiga precisa ser editada. Por isso cada feature só acrescenta a permissão de que
   precisa (a `feat_data02`, que só lê, acrescenta só `read`), a escrita já nasce desmembrada em
   `create`/`update`/`delete` com validação, e nenhuma regra usa `write` genérico.
2. **Consulta `collectionGroup` ignora as regras de caminho aninhado.** Precisa de um bloco
   `match /{path=**}/<colecao>/{id}` próprio. Afeta a `feat_data04`, a única que cruza
   empreendimentos.

### Validar o conteúdo, não só o dono

Saber **quem** escreve não basta: o dono legítimo de um documento ainda pode gravar dado inválido
pelo console. Onde o dado sustenta uma regra de negócio, a regra de segurança também confere
**o que** é escrito — com `keys().hasOnly(...)`, `diff().affectedKeys()` e `get()` nos documentos
relacionados. Os casos principais:

| Coleção | O que a regra confere | Onde |
|---|---|---|
| `appointments` | criação só por cliente, com status `scheduled`, RN04/RN06/RN08/RN09, duração e cópias conferidas, junto com o slot de `busySlots` ([ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md)); depois disso, só transições de `status` | [`feat_data03`](feat_data03-Novo-agendamento.md#regras-de-segurança) |
| `users` | autocadastro só como `customer` ou `business`, com apenas `type`; o tipo `professional` só é criado pelo empreendimento, junto com o documento do profissional | [`feat_data00`](feat_data00-Autenticacao.md#regras-de-segurança), [`feat_data07`](feat_data07-Cadastro-edicao-de-profissional.md#regras-de-segurança) |
| `customers` | cadastro grava só nome, telefone e CPF; depois, só nome e telefone mudam | [`feat_data00`](feat_data00-Autenticacao.md#regras-de-segurança) |
| `businesses` | cadastro grava exatamente os campos do empreendimento, já ativo; inativo só é legível pelo dono | [`feat_data00`](feat_data00-Autenticacao.md#regras-de-segurança), [`feat_data02`](feat_data02-Detalhes-do-empreendimento.md#regras-de-segurança) |
| `professionals` | campos exatos, ao menos um serviço (RN11), até 7 jornadas; nasce ativo; sem exclusão física; o profissional altera só as próprias `shifts` | [`feat_data06`](feat_data06-Gestao-de-profissionais.md#regras-de-segurança), [`feat_data07`](feat_data07-Cadastro-edicao-de-profissional.md#regras-de-segurança), [`feat_data12`](feat_data12-Minha-jornada-e-folgas.md#regras-de-segurança) |
| `services` | campos exatos, duração inteira positiva (RN10), preço não negativo; nasce ativo; sem exclusão física | [`feat_data08`](feat_data08-Gestao-de-servicos.md#regras-de-segurança) |

O que não dá para verificar sem consulta (RN01, RN02, RN03, RN05) fica só no `domain/`, como risco
aceito — detalhado na `feat_data03`.

## Índices necessários

Consolidado aqui porque vários são compartilhados; cada feature repete o seu no próprio documento.
Todos vão em `firestore.indexes.json`.

| Coleção | Campos | Escopo | Exigido por |
|---|---|---|---|
| `appointments` | `customerId` + `start` | **grupo de coleção** | `feat_data04` |
| `appointments` | `status` + `start` | coleção | `feat_data10` |
| `appointments` | `professionalId` + `start` | coleção | `feat_data11` |

Consultas de **campo único** (`businesses` por `active`, `services`/`professionals` por `active`,
`appointments` por faixa de `start`, `busySlots` por faixa de `end`, `timeOff` por `date`) não precisam de declaração — o Firestore
indexa campo único automaticamente.

O `queryScope` do índice da `feat_data04` precisa ser `COLLECTION_GROUP`; o padrão `COLLECTION` não
serve para consulta `collectionGroup`.

## Definição de pronto (por feature)

Conforme `METODOLOGIA.md`:

- [ ] O `service` da feature lê/escreve no Firestore, sem alterar `components/`/`hooks/`
- [ ] Regra de negócio coberta por teste (quando houver regra)
- [ ] Integrada ao build principal
