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
| `listBusinesses` | `businesses/services/businessService.ts` | `feat_data01` | — |
| `getBusinessById` | `businesses/services/businessService.ts` | `feat_data02` | — |
| `listServicesForBusiness` (só ativos) | `businesses/services/businessService.ts` | `feat_data02` | `feat_data03`, `feat_data07` |
| `listProfessionalsForBusiness` (só ativos) | `businesses/services/businessService.ts` | `feat_data02` | `feat_data03` |
| `toDate` / `toTimestamp` (conversores) | `shared/lib/firestore.ts` | `feat_data03` | `feat_data04`, `feat_data09`, `feat_data10`, `feat_data11` |
| `listShiftsForProfessional` | `appointments/services/appointmentService.ts` | `feat_data03` | `feat_data12` |
| `listTimeOffForProfessional` | `appointments/services/appointmentService.ts` | `feat_data03` | `feat_data10`, `feat_data12` |
| `listAppointmentsForProfessional` | `appointments/services/appointmentService.ts` | `feat_data03` | `feat_data11` |
| `createAppointment` | `appointments/services/appointmentService.ts` | `feat_data03` | — |
| `setAppointmentStatus` | `appointments/services/appointmentService.ts` | `feat_data04` | `feat_data09` |
| `listAppointmentsForBusiness` | `appointments/services/appointmentService.ts` | `feat_data09` | `feat_data10` |
| `listProfessionalsByBusiness` (todos) | `professionals/services/professionalService.ts` | `feat_data06` | `feat_data07`, `feat_data10` |
| `createProfessional` / `updateProfessional` | `professionals/services/professionalService.ts` | `feat_data07` | `feat_data12` (só `updateProfessionalShifts`) |
| `getSecondaryAuth` | `shared/lib/secondaryAuth.ts` | `feat_data07` | — |
| `firebaseConfig` (passa a ser exportado) | `shared/lib/firebase.ts` | `feat_data07` | — |
| `listServicesByBusiness` (todos) | `services-catalog/services/serviceCatalogService.ts` | `feat_data08` | — |

## Regras de segurança do Firestore

São **incrementais**: `feat_data00` cria o arquivo `firestore.rules` com a base (`users`,
`customers`, `businesses`), e cada feature seguinte adiciona a regra da coleção que passa a tocar.
Cada documento tem uma seção "Regras de segurança" com o trecho que ele acrescenta.

Sem backend (ADR 0002), **a regra de segurança é a única barreira real** entre empreendimentos —
a validação de front-end serve à consistência do fluxo, não à segurança.

### Duas armadilhas que valem conhecer antes de escrever a primeira regra

1. **Regras são somadas, nunca subtraídas.** Se dois blocos casam com o mesmo documento, basta um
   permitir. Por isso uma regra restritiva escrita depois **não** limita uma permissiva escrita
   antes — a antiga precisa ser editada. É o caso de `professionals`, escrita na `feat_data02` e
   substituída na `feat_data12`.
2. **Consulta `collectionGroup` ignora as regras de caminho aninhado.** Precisa de um bloco
   `match /{path=**}/<colecao>/{id}` próprio. Afeta a `feat_data04`, a única que cruza
   empreendimentos.

## Índices necessários

Consolidado aqui porque vários são compartilhados; cada feature repete o seu no próprio documento.
Todos vão em `firestore.indexes.json`.

| Coleção | Campos | Escopo | Exigido por |
|---|---|---|---|
| `appointments` | `professionalId` + `status` + `start` | coleção | `feat_data03` |
| `appointments` | `customerId` + `start` | **grupo de coleção** | `feat_data04` |
| `appointments` | `status` + `start` | coleção | `feat_data10` |
| `appointments` | `professionalId` + `start` | coleção | `feat_data11` |

Consultas de **campo único** (`businesses` por `active`, `services`/`professionals` por `active`,
`appointments` por faixa de `start`, `timeOff` por `date`) não precisam de declaração — o Firestore
indexa campo único automaticamente.

O `queryScope` do índice da `feat_data04` precisa ser `COLLECTION_GROUP`; o padrão `COLLECTION` não
serve para consulta `collectionGroup`.

## Definição de pronto (por feature)

Conforme `METODOLOGIA.md`:

- [ ] O `service` da feature lê/escreve no Firestore, sem alterar `components/`/`hooks/`
- [ ] Regra de negócio coberta por teste (quando houver regra)
- [ ] Integrada ao build principal
