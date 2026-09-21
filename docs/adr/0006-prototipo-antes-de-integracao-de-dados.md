# ADR 0006 — Protótipo navegável antes da integração de dados

**Data:** 2026-09-18
**Status:** Aceito
**Afeta:** a convenção "Definição de pronto" e o Processo 5 (Build by Feature) de `METODOLOGIA.md`

---

## Contexto

A metodologia original (FDD adaptado) constrói cada feature como uma **fatia vertical completa**:
tela → hook → service → Firestore, já funcionando ponta a ponta antes de passar para a próxima
feature. Essa é a "Definição de pronto" registrada em `METODOLOGIA.md`.

Decisão revista: em vez de uma fatia vertical por vez, o desenvolvimento passa a ter **dois
passes horizontais**:

1. Construir **todas** as telas navegáveis do sistema com dados **mockados** (sem Firestore).
2. Só depois, tela por tela, trocar o mock pela integração real com o Firestore.

Motivação do autor: validar o fluxo completo de navegação e as regras de acesso por tipo de conta
(cliente vê a lista de empreendimentos; empreendimento vê a gestão dos próprios funcionários, não
a lista de outros salões) **antes** de investir em modelagem de dados e services — pegar problema
de fluxo/UX cedo, quando ainda é barato mudar tela.

---

## Decisão

### Dois pacotes de features, documentados em pastas separadas

| Pacote | Pasta | Convenção de nome | Conteúdo |
|---|---|---|---|
| **Protótipo** | `docs/features/prototype/` | `feat_protNN-Nome-da-tela.md` | Telas navegáveis, dado mockado, sem Firestore |
| **Integração de dados** | `docs/features/data/` | `feat_dataNN-Nome-da-tela.md` | Troca do mock pela leitura/escrita real no Firestore, para a tela equivalente do protótipo |

Cada `feat_dataNN` referencia o `feat_protNN` correspondente — mesma tela, mesmo número, prefixo
diferente. Isso mantém rastreável qual integração implementa qual tela do protótipo.

### Estrutura de código — **não** vira dois apps

Continua **um único** projeto React (nenhum novo pacote/monorepo). O que muda entre os dois passes
é só a implementação do arquivo em `services/`:

- **Passe 1 (protótipo):** o `service` de cada feature retorna dado fixo em memória (array/objeto
  mockado), sem importar `shared/lib/firebase`.
- **Passe 2 (dados):** o mesmo `service` passa a importar `shared/lib/firebase` e ler/escrever no
  Firestore de verdade.

`components/` e `hooks/` **não mudam** entre os dois passes — é o mesmo contrato de dados indo e
voltando, só troca quem responde por trás do `service`. Isso só funciona porque a arquitetura já
isola o acesso a dado em `services/` (ver `docs/arquitetura.md`).

---

## Consequências

### Positivas

- Todo o fluxo de navegação e as regras de acesso por tipo de conta (RN09, ADR 0004) ficam
  visíveis e testáveis num protótipo clicável, antes de qualquer modelagem de Firestore ser
  implementada de fato.
- Erros de fluxo/UX descobertos no protótipo custam uma edição de componente. Descobertos depois
  da integração, custariam reescrever componente **e** service **e** possivelmente a modelagem do
  banco.
- A arquitetura em camadas já prevista (ADR anteriores) suporta a troca sem exigir refatoração
  estrutural — só o conteúdo de `services/` muda.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| **Suspende temporariamente a "Definição de pronto" original** (feature ponta a ponta) para as telas construídas no passe 1 | A definição de pronto passa a valer por **pacote**: uma tela do protótipo está pronta quando navega e reflete as regras de acesso; a integração está pronta quando o mock é substituído sem quebrar a tela |
| **Risco de o protótipo "enganar"** — parecer pronto sem estar | Mockar dados realistas o bastante para expor os casos de borda das regras de negócio (RN01–RN09), não só o caminho feliz |
| **Trabalho duplicado se o contrato de dados do mock não bater com o Firestore depois** | O `service` mockado usa os mesmos tipos (`types.ts`) já definidos no modelo de domínio — a forma dos dados não muda entre os passes, só a origem |

---

## Alternativas consideradas

**Manter fatia vertical por feature (abordagem original).** Rejeitada agora porque o autor quer
validar o fluxo completo multi-conta (cliente vs. empreendimento) antes de comprometer o esforço
de integração de dados feature a feature.

**Dois projetos separados (monorepo).** Rejeitada: duplicaria componentes de tela entre
"protótipo" e "app real", ou exigiria um pacote compartilhado — complexidade desnecessária, já que
a troca de mock para dado real cabe inteira dentro do `service`.

---

## Revisão

Reavaliar se o número de telas tornar difícil manter os dois passes sincronizados (protótipo
divergindo do que a integração de dados realmente precisa).
