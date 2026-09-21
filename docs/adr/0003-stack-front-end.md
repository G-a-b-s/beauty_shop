# ADR 0003 — Stack do front-end

**Data:** 2026-09-14
**Status:** Aceito

---

## Contexto

Definida a persistência (ADR 0002 — Firestore, sem backend próprio), resta escolher as
ferramentas do front-end. O projeto é uma aplicação web em React, desenvolvida por uma pessoa,
como projeto de estudo.

As quatro decisões abaixo foram tomadas em conjunto por serem interdependentes.

---

## Decisão

| Dimensão | Escolha |
|---|---|
| Linguagem | **TypeScript** |
| Build / estrutura | **Vite**, aplicação SPA |
| Estilização | **Tailwind CSS** |
| Acesso a dados | **Hooks próprios**, com `useState` e `useEffect` |

---

## Justificativa por dimensão

### TypeScript

O núcleo do sistema manipula data, hora, duração e intervalos — e as regras de conflito (RN01 a
RN05) dependem de comparar esses valores corretamente. Tipos declarados fazem boa parte dos erros
aparecer no editor, antes de rodar.

Ganho adicional: as entidades do `modelo-dominio.md` viram tipos no código. O modelo deixa de ser
só documento e passa a ser verificado pelo compilador — se o documento e o código divergirem, o
build acusa.

### Vite (SPA)

Coerente com o ADR 0002: sem backend, não há o que renderizar no servidor. Next.js traria
renderização no servidor, rotas de API e otimização de SEO — recursos que um sistema interno de
salão não usa, ao custo de conceitos a mais para aprender.

### Tailwind CSS

Os design tokens previstos na Etapa 3 (cores, espaçamento, tipografia) viram configuração do
Tailwind, e ficam impostos por construção em todas as telas — consistência sem esforço de
disciplina.

Optamos por ele em vez do Material UI porque o MUI entregaria componentes prontos, mas o design
system resultante seria dele, não do projeto. Com Tailwind, os componentes de `shared/ui/` são
autorais — e construí-los faz parte do que se quer aprender aqui.

**Custo assumido:** componentes complexos, como a visualização de agenda, serão construídos do
zero. É um custo real e previsto.

### Hooks próprios

Descartamos TanStack Query e o modo tempo real do Firestore em favor de buscar dados com
`useState` e `useEffect` escritos à mão.

**Motivo:** sendo um projeto de estudo, entender o mecanismo por dentro vale mais do que a
conveniência de uma biblioteca que o esconde. Escrever o ciclo de busca, carregamento e erro na
mão uma vez ensina o que a biblioteca depois automatiza.

**Risco:** repetir controle de carregamento e de erro em cada tela.

**Mitigação:** padronizar cedo, em `shared/hooks/`, um par de hooks genéricos de leitura e de
escrita, reutilizados por todas as features. Assim o padrão é escrito uma vez, por nós, e não
copiado dez vezes.

---

## Consequências

- Componentes de UI mais trabalhosos, especialmente a agenda — compensados por controle total
  sobre o design.
- Sem cache automático entre telas: dados são rebuscados ao navegar. Aceitável no volume de um
  salão pequeno; se virar problema, reavaliar em novo ADR.
- A tela **não** se atualiza sozinha quando outra pessoa altera um agendamento. É preciso
  recarregar. Consequência direta de não usar o tempo real do Firestore.
- Necessário configurar TypeScript, Tailwind e Vite na Etapa 2.

---

## Revisão

Reavaliar a decisão de acesso a dados se o retrabalho com carregamento e erro se mostrar maior
que o previsto, ou se a ausência de atualização automática atrapalhar o uso concorrente.
