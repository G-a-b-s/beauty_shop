# Modelo de Domínio

> **FDD — Processo 1: Develop an Overall Model**
> Status: **versão final, implementada.** Todos os requisitos funcionais e regras de negócio
> abaixo estão no sistema (integração de dados concluída em 16/11/2026); a seção 2.4 liga cada
> requisito à feature que o entrega.
> Multi-tenancy e contas de usuário: ver [ADR 0004](adr/0004-multi-tenancy-e-autenticacao.md) ·
> [ADR 0007](adr/0007-profissional-como-conta.md) (profissional também é conta)

---

## 1. Propósito

Estabelecer a linguagem e as estruturas do domínio antes de qualquer código.
Tudo que vier depois — arquitetura, features, telas — deriva daqui.

---

## 2. Requisitos do sistema

### 2.1 Requisitos funcionais

| ID | Requisito |
|---|---|
| RF01 | O sistema deve permitir que clientes e empreendimentos criem uma conta e iniciem e encerrem uma sessão. |
| RF02 | O sistema deve permitir que profissionais iniciem uma sessão com credenciais criadas pelo empreendimento ao cadastrá-los. |
| RF03 | O sistema deve apresentar a cada tipo de conta somente as operações correspondentes ao seu papel: cliente, empreendimento ou profissional. |
| RF04 | O sistema deve permitir que o cliente consulte empreendimentos ativos e pesquise por nome ou cidade. |
| RF05 | O sistema deve permitir que o cliente consulte os dados de um empreendimento e seus serviços e profissionais ativos. |
| RF06 | O sistema deve permitir que o cliente escolha um serviço, um profissional habilitado para executá-lo, uma data e um horário disponível e confirme o agendamento. |
| RF07 | O sistema deve calcular e apresentar os horários disponíveis de um profissional considerando a jornada, as folgas, os agendamentos que ocupam horário e a duração do serviço escolhido. |
| RF08 | O sistema deve permitir que o cliente consulte seus agendamentos realizados em diferentes empreendimentos, separados entre próximos e histórico. |
| RF09 | O sistema deve permitir que o cliente cancele um agendamento futuro ainda agendado. |
| RF10 | O sistema deve permitir que o cliente consulte e atualize o próprio nome e telefone. |
| RF11 | O sistema deve permitir que o empreendimento consulte os profissionais vinculados a ele, incluindo os inativos, e ative ou inative cada profissional. |
| RF12 | O sistema deve permitir que o empreendimento cadastre e edite profissionais, associe a cada profissional os serviços que executa e defina sua jornada inicial. |
| RF13 | O sistema deve permitir que o empreendimento consulte, cadastre e edite seus serviços, bem como ative ou inative cada serviço. |
| RF14 | O sistema deve permitir que o empreendimento consulte a agenda diária consolidada de seus profissionais. |
| RF15 | O sistema deve permitir que o empreendimento registre um agendamento como realizado, falta ou cancelado. |
| RF16 | O sistema deve permitir que cada profissional consulte seus próprios agendamentos nas visões de dia, semana e mês, com a data, o horário e o status de cada agendamento. |
| RF17 | O sistema deve permitir que o profissional consulte e altere a própria jornada semanal. |
| RF18 | O sistema deve permitir que o profissional cadastre e remova as próprias folgas. |
| RF19 | O sistema deve apresentar, para cada profissional e período selecionado, a quantidade de atendimentos realizados e a taxa de ocupação. |

### 2.2 Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | **Usabilidade:** ao criar, editar, cancelar ou alterar o status de um registro, a interface deve apresentar confirmação de sucesso ou mensagem de falha; campos obrigatórios inválidos devem bloquear o envio e indicar o problema. |
| RNF02 | **Idioma:** todos os textos apresentados na interface ao usuário devem estar em português do Brasil. |
| RNF03 | **Controle de acesso:** operações protegidas devem exigir autenticação; cada conta só pode executar operações autorizadas para seu tipo e acessar dados próprios ou explicitamente compartilhados com ela. |
| RNF04 | **Isolamento entre empreendimentos:** uma conta de empreendimento só pode consultar ou alterar profissionais, serviços, jornadas, folgas e agendamentos pertencentes ao próprio empreendimento. |
| RNF05 | **Persistência:** no sistema integrado, alterações confirmadas em dados cadastrais, profissionais, serviços, jornadas, folgas e agendamentos devem continuar disponíveis após o encerramento e reinício da sessão. |
| RNF06 | **Desempenho:** nas condições de teste documentadas e com conexão estável, as telas principais devem estar prontas para uso em até 3 segundos; interações locais devem responder em até 1 segundo; operações que dependem de serviços externos devem apresentar sucesso ou erro em até 5 segundos. |
| RNF07 | **Disponibilidade e falhas:** o sistema não garante um percentual de disponibilidade dos serviços externos; quando uma dependência estiver indisponível, deve informar a falha e não apresentar como concluída uma operação que não foi confirmada. |

### 2.3 Observações sobre os requisitos

Esta subseção esclarece como interpretar e avaliar os requisitos da seção. Ela não acrescenta
requisitos funcionais nem substitui os critérios definidos nas tabelas.

- **Tipos de requisito:** requisitos funcionais (RF) descrevem serviços e comportamentos que o
    sistema deve oferecer. Requisitos não funcionais (RNF) definem condições de qualidade,
    operação e proteção aplicáveis a esses serviços.
- **Avaliação de desempenho:** os limites do RNF06 devem ser medidos em condições de teste
    documentadas, incluindo dispositivo, navegador e conexão. Para operações externas, mede-se o
    tempo até a interface apresentar sucesso ou erro.
- **Disponibilidade:** o RNF07 especifica o comportamento esperado diante de falhas, não uma
    garantia de uptime. A disponibilidade da hospedagem e dos serviços externos está fora do
    controle do projeto.
- **Acessibilidade:** não foram definidos requisitos nem critérios de conformidade; esta versão
    não declara aderência a um padrão ou nível de acessibilidade.

### 2.4 Rastreabilidade: requisito → feature

Cada requisito funcional foi entregue primeiro no protótipo (`feat_protNN`, dados em memória) e
depois integrado ao Firebase (`feat_dataNN`). A tabela aponta a feature de integração, cujo
documento traz os critérios de pronto verificados.

| Requisito | Feature |
|---|---|
| RF01 contas, login e logout | [`feat_data00`](features/data/feat_data00-Autenticacao.md) |
| RF02 login do profissional | [`feat_data00`](features/data/feat_data00-Autenticacao.md) · [`feat_data07`](features/data/feat_data07-Cadastro-edicao-de-profissional.md) |
| RF03 operações por tipo de conta | [`feat_data00`](features/data/feat_data00-Autenticacao.md) (rotas por perfil) e regras de segurança de cada feature |
| RF04 consultar e pesquisar empreendimentos | [`feat_data01`](features/data/feat_data01-Listagem-de-empreendimentos.md) |
| RF05 dados, serviços e profissionais do empreendimento | [`feat_data02`](features/data/feat_data02-Detalhes-do-empreendimento.md) |
| RF06 novo agendamento | [`feat_data03`](features/data/feat_data03-Novo-agendamento.md) |
| RF07 horários disponíveis | [`feat_data03`](features/data/feat_data03-Novo-agendamento.md) · [`feat_data12`](features/data/feat_data12-Minha-jornada-e-folgas.md) |
| RF08 meus agendamentos (próximos e histórico) | [`feat_data04`](features/data/feat_data04-Meus-agendamentos.md) |
| RF09 cancelar agendamento | [`feat_data04`](features/data/feat_data04-Meus-agendamentos.md) |
| RF10 meus dados | [`feat_data05`](features/data/feat_data05-Meus-dados-cliente.md) |
| RF11 gestão de profissionais | [`feat_data06`](features/data/feat_data06-Gestao-de-profissionais.md) |
| RF12 cadastro e edição de profissional | [`feat_data07`](features/data/feat_data07-Cadastro-edicao-de-profissional.md) |
| RF13 gestão de serviços | [`feat_data08`](features/data/feat_data08-Gestao-de-servicos.md) |
| RF14 agenda do empreendimento | [`feat_data09`](features/data/feat_data09-Agenda-do-empreendimento.md) |
| RF15 registrar realizado, falta ou cancelado | [`feat_data09`](features/data/feat_data09-Agenda-do-empreendimento.md) |
| RF16 agenda do profissional | [`feat_data11`](features/data/feat_data11-Minha-agenda-profissional.md) |
| RF17 jornada pelo profissional | [`feat_data12`](features/data/feat_data12-Minha-jornada-e-folgas.md) |
| RF18 folgas pelo profissional | [`feat_data12`](features/data/feat_data12-Minha-jornada-e-folgas.md) |
| RF19 produtividade e taxa de ocupação | [`feat_data10`](features/data/feat_data10-Produtividade.md) |

RNF03 e RNF04 (controle de acesso e isolamento) são garantidos pelas regras de segurança do
Firestore, resumidas em [`arquitetura.md`](arquitetura.md#quem-pode-fazer-o-quê-regras-de-segurança).

### 2.5 Verificação dos requisitos não funcionais

| Requisito | Como foi atendido |
|---|---|
| RNF01 | Toda ação de criar, editar, cancelar ou alterar status mostra mensagem de sucesso ou de falha (ex.: "Agendamento confirmado: …", "Folga removida", "Não foi possível salvar. Tente novamente"). Formulários com campo inválido desabilitam o envio e listam o que falta ("Para salvar: …"). Ações sem volta ou de impacto grande pedem confirmação antes. |
| RNF02 | Todos os textos de tela em português; erros do Firebase são traduzidos (`shared/lib/firebaseErrors.ts`). |
| RNF03, RNF04 | Regras de segurança do Firestore, testadas com scripts que tentam as operações proibidas. |
| RNF05 | Todos os dados no Cloud Firestore. |
| RNF06 | Medido — ver abaixo. |
| RNF07 | Falhas do Firebase viram mensagem na tela; nenhuma operação é dada como concluída antes da confirmação do Firestore (a tela só muda depois que a gravação responde). |

**Medição do RNF06** — 16/11/2026, condições:

- **Dispositivo:** notebook de desenvolvimento com Windows 11 Pro, na rede local dele.
- **Navegador:** Chromium controlado pelo Playwright.
- **Versão do app:** build de produção (`npm run build` + `npm run preview`), a mesma publicada no
  GitHub Pages, servida localmente; Firebase acessado pela internet.
- **Dados:** banco de demonstração (4 empreendimentos, 13 profissionais, ~55 agendamentos).
- **Como:** tempo entre a ação (abrir a URL, clicar, digitar) e o conteúdo esperado aparecer na tela.

| Tipo | Limite | Pior caso medido | Exemplos medidos |
|---|---|---|---|
| Tela pronta para uso | 3 s | **1,05 s** | Abrir o app 0,74 s · Empreendimentos 1,05 s · Meus agendamentos 0,94 s · Profissionais 0,99 s · Serviços 1,02 s · Agenda 0,96 s · Produtividade 0,99 s · Minha agenda 0,96 s · Minha jornada 0,94 s |
| Interação local | 1 s | **0,05 s** | Busca por cidade 0,02 s · horários do dia 0,04 s · abrir janela de confirmação 0,05 s |
| Operação externa até sucesso ou erro | 5 s | **1,94 s** | Login 1,94 s · confirmar agendamento 0,37 s · cancelar 0,15 s · registrar inativação 0,24 s · salvar jornada 0,22 s · adicionar folga 0,25 s · remover folga 0,13 s |

Todas as medições ficaram abaixo dos limites. Telas abertas pelo menu (sem recarregar a página)
ficaram entre 0,15 s e 0,26 s.

---

## 3. Linguagem ubíqua

Termos do domínio usados de forma consistente em documentação, código e interface.

| Termo | Significado |
|---|---|
| **Conta de acesso** | Identidade autenticada associada a um cliente, empreendimento ou profissional. Credenciais são responsabilidade do mecanismo de autenticação, não atributos cadastrais do domínio. |
| **Empreendimento** | Salão ou barbearia cadastrado na plataforma; tem conta própria e seus funcionários |
| **Profissional** | Funcionário de um empreendimento que executa os serviços (cabeleireiro, manicure, esteticista) |
| **Cliente** | Quem recebe o atendimento; tem conta própria na plataforma e agenda em um ou mais empreendimentos |
| **Serviço** | O que é oferecido, com duração e preço definidos |
| **Agendamento** | Compromisso marcado: um cliente, um profissional, um serviço, uma data/hora |
| **Jornada** | Horário de trabalho recorrente de um profissional em um dia da semana |
| **Folga** | Ausência pontual em uma data específica, que anula a jornada daquele dia |
| **Escala** | Conjunto das jornadas e folgas de um profissional |
| **Disponibilidade** | Os intervalos de tempo em que um profissional pode receber agendamento |
| **Atendimento** | Agendamento que foi efetivamente realizado |

> Nota: *Agendamento* e *Atendimento* **não** são sinônimos. Agendamento é o compromisso;
> atendimento é o agendamento concluído. A distinção importa para as métricas de produtividade
> (RF19).

---

## 4. Entidades

### Empreendimento

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | identificador da conta de acesso associada |
| nome | texto | sim | nome do salão/barbearia exibido ao cliente |
| telefone | texto | não | |
| cnpj | texto | sim | identificação do negócio |
| endereco | texto | sim | endereço completo, exibido na tela de detalhes |
| cidade | texto | sim | usada na busca de empreendimentos (RF04) |
| ativo | booleano | sim | inativo não aparece na busca do cliente |

Dono de `Profissional` e `Serviço` — ver "Modelagem no Firestore" em `docs/arquitetura.md` para o
isolamento entre empreendimentos.

### Profissional

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | identificador da conta de acesso associada |
| empreendimentoId | referência | sim | empreendimento ao qual o funcionário pertence |
| nome | texto | sim | |
| telefone | texto | não | |
| servicos | lista de Serviço | sim | quais serviços sabe executar (do mesmo empreendimento) |
| ativo | booleano | sim | inativo não aparece para agendamento |

Tem conta própria, mas **não se autocadastra**: o empreendimento cria suas credenciais no cadastro.
Com a conta, o profissional acessa sua própria agenda e ajusta sua jornada e folgas. As credenciais
pertencem à conta de acesso, não aos dados cadastrais do profissional.

### Serviço

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | |
| empreendimentoId | referência | sim | empreendimento ao qual o serviço pertence |
| nome | texto | sim | ex.: "Corte feminino" |
| duracaoMinutos | inteiro positivo | sim | base do cálculo de horário |
| preco | decimal | sim | |
| ativo | booleano | sim | |

### Cliente

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | identificador da conta de acesso associada |
| nome | texto | sim | |
| telefone | texto | sim | principal forma de contato no setor |
| cpf | texto | sim | identificação da pessoa |

Entidade **global**: a mesma conta de cliente agenda em empreendimentos diferentes, não pertence a
nenhum deles.

### Agendamento

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | |
| empreendimentoId | referência | sim | empreendimento em que o agendamento foi feito |
| clienteId | referência | sim | |
| profissionalId | referência | sim | deve pertencer ao mesmo `empreendimentoId` (RN09) |
| servicoId | referência | sim | deve pertencer ao mesmo `empreendimentoId` (RN09) |
| duracaoMinutos | inteiro | sim | duração acordada no momento do agendamento; não acompanha alterações posteriores no serviço |
| inicio | data e hora | sim | |
| fim | data e hora | sim | derivado: `inicio + duracaoMinutos` |
| status | enum | sim | `Agendado` · `Realizado` · `Cancelado` · `Falta` |
| observacao | texto | não | |

> `fim` e `duracaoMinutos` preservam o horário e a duração combinados mesmo que o serviço seja
> alterado depois. Os nomes exibidos no histórico também são cópias do momento da marcação; a
> estratégia de armazenamento dessas cópias é detalhada na arquitetura.

### Jornada

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | |
| profissionalId | referência | sim | |
| diaSemana | enum | sim | segunda … domingo |
| horaInicio | hora | sim | |
| horaFim | hora | sim | |

Um profissional tem **uma jornada por dia da semana em que trabalha**. Dia sem jornada = dia não
trabalhado.

Jornada é o conceito do domínio; a representação atual mantém a lista semanal de jornadas dentro
do registro do profissional, em vez de tratá-la como uma coleção independente.

### Folga

| Atributo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | identificador | sim | |
| profissionalId | referência | sim | |
| data | data | sim | |
| motivo | texto | não | |

---

## 5. Diagrama de entidades

```mermaid
erDiagram
    EMPREENDIMENTO ||--o{ PROFISSIONAL : "emprega"
    EMPREENDIMENTO ||--o{ SERVICO : "oferece"
    EMPREENDIMENTO ||--o{ AGENDAMENTO : "recebe"
    PROFISSIONAL ||--o{ JORNADA : "cumpre"
    PROFISSIONAL ||--o{ FOLGA : "possui"
    PROFISSIONAL ||--o{ AGENDAMENTO : "executa"
    PROFISSIONAL }o--o{ SERVICO : "sabe executar"
    CLIENTE ||--o{ AGENDAMENTO : "solicita"
    SERVICO ||--o{ AGENDAMENTO : "compoe"
```

---

## 6. Regras de negócio

O coração do sistema. São estas regras que separam o app de uma planilha.

| ID | Regra | Origem |
|---|---|---|
| **RN01** | Um agendamento não pode se sobrepor a outro agendamento ativo do mesmo profissional | RF06, RF07 |
| **RN02** | O agendamento deve estar dentro da jornada do profissional naquele dia da semana | RF07 |
| **RN03** | Não é permitido agendar em data de folga do profissional | RF07 |
| **RN04** | O profissional só pode ser agendado para serviços que sabe executar | RF06 |
| **RN05** | O agendamento não pode ultrapassar o fim da jornada do dia | RF07 |
| **RN06** | Não é permitido criar agendamento em data/hora passada | RF06 |
| **RN07** | Agendamento `Cancelado` ou `Falta` libera o horário para novo agendamento | RF07, RF09, RF15 |
| **RN08** | Apenas profissionais e serviços ativos podem ser usados em novos agendamentos | RF06 |
| **RN09** | O profissional e o serviço de um agendamento devem pertencer ao mesmo empreendimento do agendamento | RF06 |
| **RN10** | A duração de um serviço deve ser um número inteiro positivo de minutos | RF13 |
| **RN11** | Um profissional deve estar associado a pelo menos um serviço para ser cadastrado | RF12 |
| **RN12** | Não é permitido cadastrar folga em data passada | RF18 |

**Sobre RN01 — definição de sobreposição.** Dois agendamentos A e B conflitam quando:

```
A.inicio < B.fim   E   B.inicio < A.fim
```

Encostar não é conflito: um agendamento que termina 10:00 e outro que começa 10:00 convivem.
Esta é a regra com mais casos de borda do sistema e foi desenvolvida com **teste primeiro**,
conforme a convenção de TDD pontual (`appointments/domain/conflict.test.ts`, `npm test`).

**Sobre RN07 — na implementação.** O horário de um agendamento fica reservado só enquanto ele está
`Agendado`. Qualquer mudança de status — `Cancelado`, `Falta` ou `Realizado` — libera o horário;
como `Realizado` só faz sentido depois do atendimento, na prática o efeito é o da regra.

**Onde cada regra é garantida** (tela, domínio ou regras de segurança do Firestore): ver
[`arquitetura.md`, seção 5](arquitetura.md#5-onde-cada-regra-de-negócio-vive).

---

## 7. Valores derivados

Não são armazenados — calculados sob demanda.

| Valor | Cálculo | Atende |
|---|---|---|
| **Horários livres** | intervalos da jornada que comportam a duração do serviço, excluídas folgas e sobreposições com agendamentos ativos | RF07 |
| **Atendimentos realizados** | contagem de agendamentos com status `Realizado` no período selecionado | RF19 |
| **Minutos ocupados** | soma da duração registrada nos agendamentos `Realizado` no período | RF19 |
| **Minutos disponíveis** | soma da duração das jornadas no período, excluídos os dias de folga | RF19 |
| **Taxa de ocupação** | minutos ocupados ÷ minutos disponíveis; se não houver minutos disponíveis, o resultado é zero | RF19 |

A **taxa de ocupação** é a métrica central do trabalho: é ela que traduz *"produtividade
individual"* em número comparável entre profissionais com jornadas diferentes.

---

## 8. Premissas de escopo

Decisões tomadas para manter o projeto enxuto. Registradas para que o limite do escopo fique
explícito e não seja reaberto por engano no meio do desenvolvimento.

| # | Premissa | Justificativa |
|---|---|---|
| ~~P1~~ | ~~Salão único. Não há entidade `Salão` nem multi-tenant~~ | **Revisada pelo ADR 0004** — a plataforma passou a atender múltiplos empreendimentos |
| ~~P2~~ | ~~Sem autenticação por perfil. Uso administrativo interno~~ | **Revisada pelo ADR 0004 e estendida pelo ADR 0007** — cliente, empreendimento e profissional têm contas autenticadas |
| ~~P3~~ | ~~Cliente não acessa o sistema. Quem agenda é o salão~~ | **Revisada pelo ADR 0004** — o cliente tem conta própria e agenda diretamente |
| P4 | **Sem controle financeiro.** `preco` existe apenas como dado do serviço | Fora do escopo|
| P5 | **Sem notificações** (e-mail, SMS, WhatsApp) | Dependência externa desnecessária ao objetivo |
| ~~P6~~ | ~~Linguagem do domínio em português no código~~ | **Revisada pelo [ADR 0005](adr/0005-idioma-do-codigo.md)** — código em inglês, documentação e texto de tela continuam em português |
| P7 | **Sem Custom Claims / Cloud Functions.** O tipo de conta (cliente, empreendimento ou profissional) é resolvido lendo `users/{uid}` no Firestore, não no token de autenticação | Evita reintroduzir backend — coerente com o ADR 0002. Ver ADR 0004 e ADR 0007 |
| P8 | **Janela de agendamento de 60 dias.** O cliente agenda a partir de hoje até 60 dias à frente, num calendário mensal | Limita a navegação e evita compromissos que o salão ainda não planejou. Decidido nos testes da `feat_data03` |
| P9 | **Sem atualização em tempo real.** As telas leem os dados ao abrir ou ao trocar de período; mudanças de outra conta aparecem ao recarregar | Consequência do ADR 0003 |

---

## 9. Questões encerradas nesta versão

Questões levantadas na modelagem e fechadas, para esta versão, pela opção mais simples.

| # | Questão | Decisão |
|---|---|---|
| Q1 | Serviço pode ter duração variável por profissional? | **Não.** A duração é do serviço e vale para todos os profissionais que o executam |
| Q2 | Precisa de intervalo entre atendimentos (limpeza/descanso)? | **Não.** Agendamentos podem encostar (fim de um = início do outro), como define a RN01 |
