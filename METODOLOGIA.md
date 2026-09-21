# Metodologia do Projeto

> **Documento vivo.** Serve de guia para saber em que etapa estamos e o que vem a seguir.
> Última atualização: 2026-09-14

---

## 📍 Onde estamos agora

**Etapa 1 — Modelo de Domínio e Arquitetura** ✅ concluída (revisada em 2026-09-18, ver
[ADR 0004](docs/adr/0004-multi-tenancy-e-autenticacao.md) — projeto virou plataforma multi-tenant)
**Etapa 2 — Walking Skeleton** ✅ concluída — projeto React, conexão com Firestore e
cadastro/login (cliente e empreendimento) funcionando ponta a ponta
**Etapa 3 — Fundação Visual Mínima** ✅ concluída — Tailwind configurado, `Button`/`Input`/`Card`
em `src/shared/ui/`
**Próximo passo:** Etapa 5 revisada por [ADR 0006](docs/adr/0006-prototipo-antes-de-integracao-de-dados.md)
— construir as telas do protótipo (mockadas) antes de integrar cada uma ao Firestore

**Stack definida:** React + TypeScript + Vite · Tailwind CSS · Cloud Firestore · Firebase
Authentication · hooks próprios

---

## 1. Visão geral

Projeto: aplicativo web para **gestão de agendamentos e escala de profissionais em salões de beleza**
(ver `Introducao.md` para a fundamentação).

Stack prevista: **React** no front-end. Persistência (Firebase ou SQLite) ainda **não decidida** —
será registrada como decisão formal na Etapa 1.

---

## 2. Metodologia escolhida: FDD adaptado

Adotamos **Feature-Driven Development (FDD)** — De Luca e Coad, 1997 — adaptado para
desenvolvimento individual.

### Por que FDD

- É **model-first**: começa pelo modelo de domínio, o que dá base arquitetural sólida.
- Organiza o trabalho em **features pequenas e nomeadas por valor de negócio**, não por tarefa técnica.
- A *feature list* gerada documenta os requisitos de forma clara e rastreável.
- É uma metodologia **consolidada e bem documentada** (Palmer & Felsing, 2002), com material de
  referência disponível para consultar durante o desenvolvimento.

### Os 5 processos do FDD

| # | Processo original | Como aplicamos aqui | Frequência |
|---|---|---|---|
| 1 | Develop an Overall Model | Modelo de domínio + arquitetura | uma vez |
| 2 | Build a Feature List | Lista de features por área de negócio | uma vez |
| 3 | Plan by Feature | Ordenação por dependência e risco | uma vez |
| 4 | Design by Feature | Componentes, dados e regras da feature | por feature |
| 5 | Build by Feature | Implementa, testa, integra | por feature |

### O que descartamos do FDD original

FDD nasceu para times grandes (~50 devs). Não usamos:

- ❌ Papéis formais (Chief Architect, Class Owner, Feature Team) — dev individual
- ❌ Code inspection e design inspection em reunião — sem time
- ❌ Métricas de progresso por percentual de milestone — excesso de controle para o escopo

Mantemos o essencial: **modelo primeiro, features pequenas, progresso medido por feature entregue.**

---

## 3. Roadmap

### Etapa 1 — Modelo de Domínio e Arquitetura ✅ **concluída**

- [x] Extrair requisitos da Introdução do protótipo
- [x] Modelar entidades do domínio (Cliente, Profissional, Serviço, Agendamento, Escala)
- [x] Definir arquitetura e estrutura de pastas
- [x] **ADR 0001** — registrar decisões arquiteturais
- [x] **ADR 0002** — persistência: Firebase vs SQLite → **Firestore**
- [x] **ADR 0003** — stack do front-end → TypeScript, Vite, Tailwind, hooks próprios
- [x] **ADR 0004** — pivô para plataforma multi-tenant: contas de cliente/empreendimento e
      isolamento de dados por empreendimento
- [x] **ADR 0005** — código (variáveis, funções, tipos, pastas, Firestore) em inglês; documentação
      e texto de tela continuam em português
- [x] **ADR 0008** — React Router para navegação, com rotas por tipo de conta
- [x] **ADR 0009** — autenticação também mockada durante o protótipo, para o isolamento
      multi-tenant e o fluxo do profissional ficarem testáveis

**Entrega:** `docs/modelo-dominio.md` · `docs/arquitetura.md` · `docs/adr/`

---

### Etapa 2 — Walking Skeleton ✅ **concluída**

Fatia mais fina possível atravessando **todas** as camadas, funcionando ponta a ponta.

- [x] Projeto React inicializado
- [x] Conexão com a camada de persistência
- [x] Cadastro e login de conta (cliente e empreendimento) — Firebase Authentication
      *(temporariamente desligado durante o protótipo, ver [ADR 0009](docs/adr/0009-autenticacao-mockada-no-prototipo.md))*
- [x] Um CRUD mínimo completo (tela → dados → tela) — o cadastro de conta já é esse CRUD (cria e lê
      de volta o documento em `customers`/`businesses`)

**Por quê:** arquitetura no papel mente. Uma fatia real prova que as peças conversam **antes**
de construirmos features em cima de uma suposição errada.

**Entrega:** aplicação rodando com um fluxo real.

---

### Etapa 3 — Fundação Visual Mínima ✅ **concluída**

- [x] Design tokens (cores, espaçamento, tipografia) — Tailwind v4, paleta `primary` (teal),
      fonte Poppins
- [x] Escolha da biblioteca de componentes — Tailwind CSS (ADR 0003), componentes autorais
- [x] Componentes base: `Button`, `Input`, `Card`

**Importante:** o design system **não** foi construído inteiro de uma vez. Ele **cresce junto com
as features** — cada feature que precisar de um componente novo o adiciona ao sistema.

**Entrega:** `src/shared/ui/` com a base.

---

### Etapa 4 — Feature List e Planejamento

- [ ] Escrever a lista completa de features
- [ ] Agrupar por área de negócio (*feature sets*)
- [ ] Ordenar por dependência e risco

**Áreas de negócio previstas:**

1. Contas e Autenticação (cliente e empreendimento)
2. Gestão de Empreendimentos
3. Gestão de Profissionais
4. Gestão de Serviços
5. Escala e Disponibilidade
6. Agendamento ← núcleo do sistema
7. Produtividade ← diferencial do trabalho

**Entrega:** `docs/feature-list.md` (~17 features).

---

### Etapa 5 — Ciclo de Desenvolvimento (revisada pelo [ADR 0006](docs/adr/0006-prototipo-antes-de-integracao-de-dados.md))

Em vez de uma fatia vertical por feature, o ciclo passa a ter **dois passes horizontais**:

```
Passe 1 — Protótipo             Passe 2 — Integração de dados
(todas as telas, mock)    →     (mock → Firestore, tela por tela)
```

**Passe 1 — Protótipo:** cada tela navegável vira um documento `feat_protNN-Nome-da-tela.md` em
`docs/features/prototype/`. O `service` da feature retorna dado mockado, sem tocar no Firestore.

**Passe 2 — Integração de dados:** para cada tela já prototipada, um documento
`feat_dataNN-Nome-da-tela.md` em `docs/features/data/` (mesmo número do `feat_prot` equivalente)
descreve a troca do mock pela leitura/escrita real — só o arquivo em `services/` muda.

- [x] Rascunhar a lista de telas do protótipo, cruzando com as áreas de negócio e as regras de
      acesso por tipo de conta (cliente, empreendimento e profissional — [ADR 0007](docs/adr/0007-profissional-como-conta.md))
- [x] Documentar cada tela em `docs/features/prototype/` — `feat_prot01` a `feat_prot12`
- [x] Construir as telas do protótipo (mock) — `feat_prot01` a `feat_prot12`
- [x] Documentar a integração de cada tela em `docs/features/data/` — `feat_data00` a `feat_data12`,
      com o mapa de dependências em [`docs/features/data/README.md`](docs/features/data/README.md)
- [ ] Construir a integração de cada tela

**Áreas de negócio cobertas pelas telas** (mesmas da Etapa 4):

- [ ] Área 1 — Contas e Autenticação *(já concluída na Etapa 2, com dado real desde o início)*
- [ ] Área 2 — Gestão de Empreendimentos
- [ ] Área 3 — Gestão de Profissionais
- [ ] Área 4 — Gestão de Serviços
- [ ] Área 5 — Escala e Disponibilidade
- [ ] Área 6 — Agendamento
- [ ] Área 7 — Produtividade

---

## 4. Convenções de trabalho

### Nomeação de features

FDD exige um padrão rígido, e é dele que vem o valor documental:

```
<ação> o <resultado> <de|para|por> um(a) <objeto>
```

Exemplos:
- *Cadastrar um profissional*
- *Calcular os horários livres de um profissional*
- *Validar o conflito de horário de um agendamento*

Feature descreve **valor para o negócio**, nunca tarefa técnica.
❌ "Criar componente de tabela" — isso é implementação, não feature.

### Testes — TDD pontual

Não fazemos TDD no app inteiro. Aplicamos teste-primeiro **apenas no núcleo de regras de negócio**,
onde há lógica pura e muitos casos de borda:

- Validação de conflito de horário
- Cálculo de disponibilidade
- Cálculo de taxa de ocupação

Telas e componentes visuais são verificados manualmente — testá-los custa caro e agrega pouco aqui.

### ADR — Architecture Decision Records

Documento curto (1–2 páginas) registrando **uma** decisão: contexto, opções, escolha, consequências.
Numerados sequencialmente em `docs/adr/`.

**Quando criar um ADR:** ao adicionar dependência externa, mudar topologia de deploy, ou tomar
decisão cara de reverter. **Não** para cada mudança.

### Definição de pronto

Desde o [ADR 0006](docs/adr/0006-prototipo-antes-de-integracao-de-dados.md), a definição de pronto
vale **por pacote**:

**Uma tela do protótipo (`feat_prot`) está pronta quando:**

- [ ] Navega de ponta a ponta com dado mockado
- [ ] Reflete a regra de acesso por tipo de conta (quando houver)
- [ ] Componentes novos incorporados ao design system

**Uma integração de dados (`feat_data`) está pronta quando:**

- [ ] O `service` da feature lê/escreve no Firestore, sem alterar `components/`/`hooks/`
- [ ] Regra de negócio coberta por teste (quando houver regra)
- [ ] Integrada ao build principal

---

## 5. Estrutura de pastas prevista

```
src/
  features/
    auth/
    businesses/
    professionals/
    services-catalog/
    schedule/
    appointments/
    productivity/
  shared/
    ui/            ← design system, cresce com as features
    lib/
  app/
docs/
  modelo-dominio.md
  feature-list.md
  features/
    prototype/     ← feat_protNN-Nome-da-tela.md
    data/           ← feat_dataNN-Nome-da-tela.md
  adr/
    0001-registrar-decisoes-arquiteturais.md
    0002-persistencia.md
    0003-stack-front-end.md
    0004-multi-tenancy-e-autenticacao.md
    0005-idioma-do-codigo.md
    0006-prototipo-antes-de-integracao-de-dados.md
```

Nomes de pasta em inglês, conforme [ADR 0005](docs/adr/0005-idioma-do-codigo.md) — a lista de
áreas de negócio acima continua em português, pois é nomenclatura de FDD, não código.

Abordagem *feature-first*: as pastas espelham os **feature sets** do FDD.

---

## 6. Referências

- PALMER, S. R.; FELSING, J. M. *A Practical Guide to Feature-Driven Development*. Prentice Hall, 2002.
- DE LUCA, J.; COAD, P. Feature-Driven Development, 1997.
- NYGARD, M. *Documenting Architecture Decisions*, 2011.
