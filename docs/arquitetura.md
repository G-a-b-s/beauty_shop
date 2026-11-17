# Arquitetura

> **FDD — Processo 1: Develop an Overall Model** (parte 2)
> **Status:** implementado. Reflete o código ao fim da integração de dados (Passe 2 da Etapa 5,
> concluído em 16/11/2026): todas as telas usam o Firebase e não há mais dado mockado.
> Decisões de base: [ADR 0002](adr/0002-persistencia.md) · [ADR 0003](adr/0003-stack-front-end.md) ·
> [ADR 0004](adr/0004-multi-tenancy-e-autenticacao.md) · [ADR 0005](adr/0005-idioma-do-codigo.md) ·
> [ADR 0007](adr/0007-profissional-como-conta.md) · [ADR 0012](adr/0012-projecao-de-horarios-ocupados.md)
>
> **Nota de idioma:** nomes de pasta, arquivo, tipo, coleção e campo aparecem em inglês neste
> documento, conforme o ADR 0005. O texto continua em português.

---

## 1. Visão geral

Aplicação SPA em React + TypeScript, servida pelo Vite, conversando diretamente com o Cloud
Firestore. Não há backend próprio.

```
Navegador
┌─────────────────────────────────────┐
│  React SPA                          │
│                                     │
│  components  →  hooks  →  services  │ ──→  Cloud Firestore
│                  │                  │
│                  ↓                  │
│               domain                │  ← regras puras, sem dependência externa
└─────────────────────────────────────┘
```

---

## 2. As quatro camadas

A organização é **feature-first**: cada área de negócio do FDD é uma pasta, e dentro dela
repetem-se as mesmas quatro camadas.

| Camada | Responsabilidade | Pode importar |
|---|---|---|
| `components/` | Telas e componentes visuais da feature | `hooks/`, `shared/ui/` |
| `hooks/` | Estado de tela: buscar, carregar, tratar erro | `services/`, `domain/` |
| `services/` | Ler e gravar no Firestore. Traduz documento ↔ entidade | `shared/lib/firebase`, `domain/` |
| `domain/` | Regras de negócio e cálculos. Funções puras | **nada** |

### A regra que sustenta tudo

> **`domain/` não importa React, não importa Firebase, não importa nada.**

Só entram e saem valores. É isso que torna as regras testáveis sem subir aplicação nem banco — e
é o que viabiliza a convenção de TDD pontual definida na metodologia.

Na prática: a validação de conflito de horário (RN01) recebe uma lista de intervalos ocupados e um
horário candidato, e devolve se pode ou não. Ela não sabe de onde vieram os intervalos — no
protótipo vinham do mock, hoje vêm da projeção `busySlots` do Firestore, e a função não mudou.

A dependência aponta sempre para dentro. Nada que está numa camada interna conhece quem está fora.

---

## 3. Estrutura de pastas

```
src/
  App.tsx
  main.tsx
  app/
    routes.tsx                 ← rotas por perfil (cliente, empreendimento, profissional)
    layout/AppLayout.tsx       ← cabeçalho, menu, moldura das páginas

  features/
    auth/                      ← cadastro, login e sessão (firebaseAuthService, useAuth)
    businesses/                ← Empreendimento: listagem e detalhes (visão do cliente)
    professionals/             ← Profissional: gestão pelo dono, cadastro com login, minha jornada
    services-catalog/          ← Serviço (nome de pasta evita colisão com a camada `services/`)
    customers/                 ← Cliente: meus dados
    appointments/              ← Agendamento e Disponibilidade — núcleo do sistema
      domain/                  ← availability.ts, conflict.ts (+ conflict.test.ts)
    productivity/              ← Produtividade
      domain/                  ← metrics.ts (taxa de ocupação)

  shared/
    ui/                        ← Button, Input, Card, MonthCalendar, ScheduleView,
                                 ConfirmDialog + useConfirm (confirmação de ações)
    lib/
      firebase.ts              ← inicialização do Firebase (App + Firestore) e firebaseConfig
      auth.ts                  ← inicialização do Firebase Authentication
      secondaryAuth.ts         ← segundo App só para criar login de profissional (ADR 0007)
      firestore.ts             ← conversores Timestamp ↔ Date
      firebaseErrors.ts        ← tradução de erros do Firebase para mensagens em português
      date.ts                  ← utilitários de data, hora e grade do mês
      text.ts                  ← normalização de busca e capitalização de rótulos
    types/                     ← Professional, Shift, Weekday, Service, Appointment, TimeOff

docs/
  modelo-dominio.md
  arquitetura.md
  adr/
  features/
    prototype/                 ← Passe 1: escopo das telas
    data/                      ← Passe 2: integração com o Firebase, feature a feature

firestore.rules                ← regras de segurança (fonte única; publicar no Console)
firestore.indexes.json         ← índices compostos (fonte única; criar no Console)
```

Cada feature tem as pastas de camada de que precisa — `domain/` só existe onde há regra pura
(`appointments` e `productivity`).

**Onde mora o quê.** Código que só uma feature usa fica na feature. Código que duas ou mais
features usam sobe para `shared/` — foi o caso dos tipos de Profissional, Serviço, Agendamento e
Folga, que saíram do mock para `shared/types/` conforme cada mock foi removido.

**Exceção aceita: dependências diretas entre features.** A intenção inicial era que nenhuma
feature importasse outra. Na implementação ficaram dependências diretas, sempre da camada de uma
feature para a mesma camada (ou um hook) de outra, para reaproveitar uma consulta em vez de
duplicá-la — a convenção "método compartilhado não se repete" de
[`features/data/README.md`](features/data/README.md). As principais:

| Quem usa | O quê | De onde |
|---|---|---|
| quase todas as telas logadas | `useAuth`, `useCurrentBusinessId` | `auth/`, `businesses/` |
| `professionals/`, `services-catalog/` | conversores `toProfessional`, `toService` | `businesses/services/businessService.ts` |
| `professionals/`, `appointments/` | `listServicesForBusiness`, `listProfessionalsForBusiness` | `businesses/services/businessService.ts` |
| `customers/` | `refreshAccount` (atualiza o nome da sessão após salvar) | `auth/services/firebaseAuthService.ts` |
| `professionals/`, `productivity/` | `listTimeOffForProfessional`, `listAppointmentsForBusiness` | `appointments/services/appointmentService.ts` |
| `productivity/` | `listProfessionalsByBusiness` | `professionals/services/professionalService.ts` |

Mover tudo isso para `shared/` esvaziaria as features sem ganho real num projeto deste tamanho.
A regra que continua valendo sem exceção é a da seção 2: **`domain/` não importa nada.**

---

## 4. Modelagem no Firestore

O Firestore é um banco de documentos: **não tem join e não tem integridade referencial**. O
modelo de domínio não pode ser transposto tabela a tabela. Decisões:

### Coleções

Isolamento por empreendimento (multi-tenant, [ADR 0004](adr/0004-multi-tenancy-e-autenticacao.md)):
`professionals`, `services` e `appointments` vivem **dentro** do empreendimento a quem pertencem,
como subcoleções. `customers` e `users` são globais, no nível raiz.

| Caminho | Conteúdo |
|---|---|
| `users/{uid}` | `type: "customer" \| "business" \| "professional"` (+ `businessId` se `professional`) — resolve para onde rotear após login |
| `customers/{uid}` | name, phone, cpf — `{uid}` é o mesmo do Firebase Auth |
| `businesses/{uid}` | name, phone, cnpj, address, city, active — `{uid}` é o mesmo do Firebase Auth |
| `businesses/{businessId}/professionals/{uid}` | name, phone, serviceIds[], **shifts[]**, active — `{uid}` é o mesmo do Firebase Auth do profissional ([ADR 0007](adr/0007-profissional-como-conta.md)) |
| `businesses/{businessId}/professionals/{uid}/timeOff/{id}` | date, reason |
| `businesses/{businessId}/professionals/{uid}/busySlots/{inícioEmMs}` | appointmentId, start, end — projeção dos agendamentos `scheduled`, sem dado de cliente ([ADR 0012](adr/0012-projecao-de-horarios-ocupados.md)) |
| `businesses/{businessId}/services/{id}` | name, durationMinutes, price, active |
| `businesses/{businessId}/appointments/{id}` | businessId, customerId, professionalId, serviceId, businessName, professionalName, customerName, serviceName, durationMinutes, start, end, status, note |

**Por que `customers`, `businesses` e `professionals` usam o `uid` do Firebase Auth como id do
documento:** elimina uma consulta extra para descobrir "qual é o documento de dados desta conta
autenticada" — o id já é conhecido assim que o usuário loga. Para `professionals`, que fica numa
subcoleção, o `businessId` necessário para montar o caminho vem do próprio `users/{uid}`.

### Por que `shifts` fica embutido no profissional

Um profissional tem no máximo 7 turnos — uma por dia da semana. É uma lista **limitada** e que
sempre é lida junto com o profissional. Vira um campo do próprio documento: uma leitura em vez de
oito.

### Por que `timeOff` é subcoleção

Folgas crescem indefinidamente com o tempo e são consultadas por intervalo de data. Lista
ilimitada não cabe dentro de documento — vira subcoleção.

### Denormalização controlada nos agendamentos

Como não há join, listar a agenda do dia com 20 agendamentos exigiria buscar nome do cliente,
nome do profissional e nome do serviço um a um — dezenas de leituras extras.

Por isso o agendamento guarda uma **cópia** dos dados que exibe:

```ts
type Appointment = {
  // referências
  businessId: string
  professionalId: string
  customerId: string
  serviceId: string

  // cópia no momento do agendamento — não sincroniza
  businessName: string
  professionalName: string
  customerName: string
  serviceName: string
  durationMinutes: number

  start: Date
  end: Date
  status: AppointmentStatus
}
```

**Por que `businessName` também é copiado:** a tela "Meus agendamentos" do cliente
(`feat_prot04`) lista agendamentos de **vários** empreendimentos de uma vez — uma consulta
`collectionGroup` sobre `appointments` filtrada por `customerId`. Sem o nome copiado, exibir a
lista exigiria uma leitura extra por empreendimento distinto.

**Regra:** esses campos são um **registro histórico**, não um espelho. Se o serviço "Corte" mudar
de nome ou de duração amanhã, os agendamentos de ontem continuam mostrando o que foi combinado
com o cliente. Isso é correto, não é bug — e é coerente com a decisão de armazenar `end` tomada
no modelo de domínio.

### Projeção de horários ocupados (`busySlots`)

O cliente precisa saber quais horários de um profissional estão ocupados, mas não pode ler os
agendamentos de outros clientes. Cada agendamento `scheduled` grava, no mesmo `writeBatch`, um
documento em `busySlots` com só `start`, `end` e `appointmentId`; o id é o início em
milissegundos, o que faz o próprio Firestore recusar um segundo agendamento no mesmo início.
Mudar o status (cancelar, falta, realizado) apaga o slot no mesmo batch — e o horário volta a
ficar livre ([ADR 0012](adr/0012-projecao-de-horarios-ocupados.md)).

### Exclusão lógica

O Firestore não impede apagar um serviço que tem agendamentos apontando para ele. Por isso
**nada é excluído fisicamente**: profissionais e serviços têm `active: false`, e as regras de
segurança negam `delete`. Inativo some das telas de agendamento, mas o histórico continua íntegro.

A única exceção é a **folga**: nada a referencia, então é apagada de fato.

### Índices compostos

Criados no Console e versionados em `firestore.indexes.json`:

| Coleção | Campos | Escopo | Usado por |
|---|---|---|---|
| `appointments` | `customerId` ↑ + `start` ↓ | grupo de coleções | "Meus agendamentos" do cliente, que cruza empreendimentos (`feat_data04`) |
| `appointments` | `status` ↑ + `start` ↑ | coleção | atendimentos realizados no período, para a produtividade (`feat_data10`) |
| `appointments` | `professionalId` ↑ + `start` ↑ | coleção | agenda do profissional (`feat_data11`) |

A agenda do empreendimento (`feat_data09`) filtra só por faixa de `start` dentro da subcoleção e
usa o índice automático de campo único.

### Consultas por período

Agenda do empreendimento, agenda do profissional e produtividade **filtram o período no
servidor** (`where start >= início` e `< fim`) e refazem a consulta ao trocar de dia, semana, mês
ou período — em vez de baixar o histórico inteiro, que cresce sem limite.

---

## 5. Onde cada regra de negócio vive

Cada regra tem duas linhas de defesa: **na tela** (para o usuário não conseguir nem tentar) e,
quando dá para verificar com um único documento, **nas regras de segurança do Firestore** (para
quem tentar burlar pelo console do navegador, seção 6).

| Regra | Na tela / no cliente | Nas regras do Firestore |
|---|---|---|
| RN01 conflito de horário | `appointments/domain/conflict.ts` (testado em `conflict.test.ts`), usado pela disponibilidade | só o **mesmo início** (id do `busySlot`); sobreposição parcial é risco aceito |
| RN02, RN03, RN05 jornada e folga | `appointments/domain/availability.ts` — só oferece horários dentro da jornada, fora de folga e que cabem até o fim do turno; o calendário apaga os dias sem horário | não (dependem de consulta e fuso) |
| RN04 serviço do profissional | `useBookAppointment` só lista profissionais que executam o serviço | sim: `serviceId in professional.serviceIds` |
| RN06 data no passado | `availability.ts` descarta horários já passados | sim: `start > request.time` |
| RN07 status libera horário | projeção `busySlots`: só agendamento `scheduled` tem slot | sim: mudar status exige apagar o slot no mesmo batch |
| RN08 apenas ativos | consultas do cliente filtram `active == true` (`businessService`) | sim: empreendimento, profissional e serviço ativos |
| RN09 mesmo empreendimento | estrutural: profissionais e serviços são subcoleções do empreendimento | sim: os documentos são lidos pelo caminho do empreendimento |
| RN10 duração positiva | formulário de serviço só salva inteiro > 0 | sim: `durationMinutes is int && > 0` |
| RN11 ao menos um serviço | formulário de profissional desabilita "Salvar" sem serviço | sim: `serviceIds.size() > 0` |
| RN12 folga não no passado | campo de data com mínimo = hoje e botão desabilitado | não (data local × `request.time`); a regra só valida o formato `YYYY-MM-DD` |
| Taxa de ocupação | `productivity/domain/metrics.ts` | — (só leitura) |

**O que ficou em `domain/`:** as regras de cálculo — disponibilidade, conflito e taxa de ocupação.
As validações simples de formulário (RN10, RN11, RN12) e os filtros de consulta (RN04, RN08)
ficaram na camada de tela e de service, com o reforço do Firestore como garantia. A intenção
inicial de mover tudo para `domain/` não se pagou para regras de uma linha.

O detalhamento de cada regra no servidor está na
[`feat_data03`](features/data/feat_data03-Novo-agendamento.md#regras-de-negócio) e nos documentos
das features seguintes.

### Quem pode fazer o quê (regras de segurança)

| Conta | Pode |
|---|---|
| Cliente | ler empreendimentos ativos, serviços e profissionais; criar agendamento válido; ler e cancelar (só futuros) os **próprios** agendamentos; editar só nome e telefone |
| Empreendimento | editar o próprio cadastro; criar e editar profissionais e serviços do **próprio** salão (sem apagar); criar o login de profissional; ler a própria agenda e registrar Realizado, Falta ou Cancelado em agendamento ainda em aberto; gerenciar folgas dos seus profissionais |
| Profissional | ler os **próprios** agendamentos; alterar **só** a própria jornada (`shifts`); criar e apagar as próprias folgas |

Toda alteração de agendamento mexe **só** no `status`, e só a partir de `scheduled`.

---

## 6. Consequências assumidas

- **Sem backend, a validação no cliente não é uma barreira de segurança.** Qualquer regra executada
  apenas no navegador pode ser burlada por quem abrir o console. Por isso as regras de acesso,
  isolamento e conteúdo estão em `firestore.rules`. Não confundir validação de negócio com
  autorização.
- **Regras de segurança do Firestore sustentam o multi-tenancy.** Sem elas, nada impediria um
  empreendimento autenticado de ler ou escrever na subcoleção de outro. Elas checam
  `request.auth.uid` contra o `{businessId}` do caminho (ou contra `customerId`/`professionalId`
  do documento). Cada feature do Passe 2 que acrescentou regras teve um script que tenta as
  operações proibidas diretamente no Firebase e confere que são recusadas.
- **Regra de segurança valida também o conteúdo, não só o dono.** Checar quem escreve não basta:
  o dono legítimo de um agendamento poderia gravar status, horário ou nomes adulterados. Por isso
  os agendamentos são criados só com status `scheduled` e dados conferidos contra os documentos de
  origem, e depois só o `status` pode mudar, em transições definidas por tipo de conta.
- **Sem transação entre Auth e Firestore.** O cadastro de profissional cria o login primeiro e
  depois grava os documentos; se a gravação falhar, o login recém-criado é apagado na hora. Sobra
  um único caso não coberto — a rede cair entre os dois passos —, que deixa um login sem
  documentos, removível pelo console ([`feat_data07`](features/data/feat_data07-Cadastro-edicao-de-profissional.md)).
- **Sem atualização automática de tela** — consequência do ADR 0003. Mudanças feitas por outra
  conta aparecem ao recarregar ou navegar.

---

## 7. Testes

| O quê | Como |
|---|---|
| Regras de domínio (RN01) | `npm test` — test runner nativo do Node sobre `src/**/*.test.ts`, sem dependência nova |
| Regras de segurança | scripts Node com o SDK `firebase` do projeto, rodados contra o projeto Firebase de desenvolvimento, tentando cada operação proibida (resultados registrados no critério de pronto de cada `feat_data`) |
| Telas | fluxos completos de cada perfil percorridos no navegador a cada feature, com os critérios de pronto marcados nos documentos de `features/data/` |
