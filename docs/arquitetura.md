# Arquitetura

> **FDD — Processo 1: Develop an Overall Model** (parte 2)
> Decisões de base: [ADR 0002](adr/0002-persistencia.md) · [ADR 0003](adr/0003-stack-front-end.md) ·
> [ADR 0004](adr/0004-multi-tenancy-e-autenticacao.md) · [ADR 0005](adr/0005-idioma-do-codigo.md) ·
> [ADR 0007](adr/0007-profissional-como-conta.md)
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

Na prática: a validação de conflito de horário (RN01) recebe uma lista de agendamentos e um
horário candidato, e devolve se pode ou não. Ela não sabe de onde vieram os agendamentos.

A dependência aponta sempre para dentro. Nada que está numa camada interna conhece quem está fora.

---

## 3. Estrutura de pastas

```
src/
  app/
    App.tsx
    routes.tsx
    layout/                    ← cabeçalho, menu, moldura das páginas

  features/
    auth/                      ← cadastro e login de cliente e de empreendimento
      components/
      hooks/
      services/
      types.ts
    businesses/                ← Empreendimento
    professionals/             ← Profissional
      components/
      hooks/
      services/
      domain/
      types.ts
    services-catalog/          ← Serviço (nome de pasta evita colisão com a camada `services/`)
    customers/                 ← Cliente
    schedule/                  ← Escala/Disponibilidade
    appointments/              ← Agendamento — núcleo do sistema
    productivity/              ← Produtividade

  shared/
    ui/                        ← design system: Button, Input, Card…
    hooks/                     ← hooks genéricos de leitura e escrita
    lib/
      firebase.ts              ← inicialização do Firebase (App + Firestore)
      auth.ts                  ← inicialização do Firebase Authentication
      date.ts                  ← utilitários de data, hora e intervalo
    types/                     ← tipos compartilhados entre features

docs/
  modelo-dominio.md
  arquitetura.md
  feature-list.md              ← Etapa 4
  adr/
```

**Onde mora o quê.** Código que só uma feature usa fica na feature. Código que duas ou mais
features usam sobe para `shared/`. Nunca uma feature importa de outra feature diretamente — se
precisar, o compartilhado vai para `shared/`.

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
| `businesses/{businessId}/services/{id}` | name, durationMinutes, price, active |
| `businesses/{businessId}/appointments/{id}` | customerId, professionalId, serviceId, businessName, professionalName, customerName, serviceName, durationMinutes, start, end, status, note |

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

### Exclusão lógica

O Firestore não impede apagar um serviço que tem agendamentos apontando para ele. Por isso
**nada é excluído fisicamente**: profissionais e serviços têm `active: false`. Inativo some das
telas de agendamento, mas o histórico continua íntegro.

### Índices necessários

Consultas que o Firestore exige índice composto, a criar na Etapa 2:

- `appointments` por `professionalId` + `start` — agenda de um profissional
- `appointments` por `start` + `status` — agenda do dia e métricas do período

---

## 5. Onde cada regra de negócio vive

| Regra | Camada | Arquivo previsto |
|---|---|---|
| RN01 conflito de horário | `domain/` | `appointments/domain/conflict.ts` |
| RN02, RN03, RN05 jornada e folga | `domain/` | `schedule/domain/availability.ts` |
| RN04 serviço do profissional | `domain/` | `appointments/domain/validation.ts` |
| RN06 data no passado | `domain/` | `appointments/domain/validation.ts` |
| RN07 status libera horário | `domain/` | `appointments/domain/conflict.ts` |
| RN08 apenas ativos | `domain/` | `appointments/domain/validation.ts` |
| RN09 mesmo empreendimento | `domain/` | `appointments/domain/validation.ts` |
| Taxa de ocupação | `domain/` | `productivity/domain/metrics.ts` |

**Todas as regras em `domain/`.** Nenhuma validação de negócio em componente ou em service. Essa
é a condição para que sejam cobertas por teste.

---

## 6. Consequências assumidas

- **Sem backend, o cliente é confiável.** Qualquer validação pode ser burlada por quem abrir o
  console. Aceitável num protótipo de uso interno e administrativo (premissa P2 do modelo de
  domínio), mas é uma limitação conhecida do desenho — não confundir validação de negócio com
  segurança.
- **Regras de segurança do Firestore ganham peso maior com multi-tenancy.** Sem elas, nada
  impede um empreendimento autenticado de ler ou escrever na subcoleção de outro. Precisam ser
  configuradas na Etapa 2 checando `request.auth.uid` contra o `{businessId}` do caminho.
- **Sem atualização automática de tela** — consequência do ADR 0003.
