# Beauty Shop

Plataforma web para gestão de agendamentos, profissionais, serviços, escalas e produtividade em
salões de beleza e barbearias. Projeto acadêmico.

É uma **SPA** (*single-page application*) em React que conversa direto com o **Firebase**
(Authentication e Cloud Firestore), sem backend próprio. Todas as telas usam dados reais: contas,
empreendimentos, profissionais, serviços, jornadas, folgas e agendamentos ficam salvos no
Firestore e continuam lá depois de recarregar a página ou sair da conta.

## Demonstração

O app é publicado no GitHub Pages:

**https://g-a-b-s.github.io/beauty_shop/**

Para entrar, crie uma conta de cliente ou de empreendimento pela tela de login. Contas de
profissional são criadas pelo empreendimento, no cadastro do profissional.

O banco de demonstração tem dados fictícios — 4 empreendimentos (salão, barbearia, estética e
esmalteria), seus profissionais e serviços, clientes e agendamentos. A lista de contas de
demonstração é mantida fora do repositório.

## Funcionalidades

### Cliente

- Lista de empreendimentos ativos, com busca por nome ou cidade
- Detalhes do empreendimento, com serviços e profissionais ativos
- Novo agendamento: serviço → profissional → dia num **calendário mensal** (até 60 dias à frente,
  com os dias sem horário livre apagados) → horário livre → confirmação
- "Meus agendamentos": próximos e histórico, de todos os empreendimentos, com cancelamento
- Edição do próprio nome e telefone

### Empreendimento

- Profissionais: listagem (inclusive inativos), cadastro com login próprio, edição, jornada
  inicial, inativar e reativar
- Serviços: cadastro, edição, inativar e reativar
- Agenda do salão nas visões dia, semana e mês, com registro de **Realizado**, **Falta** ou
  **Cancelado**
- Produtividade: atendimentos realizados e **taxa de ocupação** por profissional, nos últimos 7
  ou 30 dias

### Profissional

- Minha agenda nas visões dia, semana e mês, com o status de cada agendamento
- Minha jornada semanal e folgas

Cada perfil tem rotas próprias. Ao acessar uma rota de outro perfil, o sistema redireciona para a
tela inicial do perfil autenticado.

Ações que não têm volta ou têm impacto grande pedem **confirmação** numa janela com o resumo do
que vai acontecer: sair da conta, cancelar agendamento, registrar Realizado/Falta/Cancelado,
cadastrar profissional (cria um login), inativar profissional ou serviço e remover folga. Criar
agendamento já tem o passo de confirmação com o resumo antes de gravar.

### Segurança

As regras de negócio são validadas na tela e **repetidas nas regras de segurança do Firestore**
(`firestore.rules`): cada empreendimento só lê e altera os próprios dados, o cliente só vê os
próprios agendamentos, o profissional só altera a própria jornada, e agendamentos só podem ser
criados com dados válidos e em horário livre. As regras foram testadas com scripts que tentam a
operação proibida diretamente no Firebase.

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript |
| Build | Vite (SPA) |
| Estilo | Tailwind CSS |
| Navegação | React Router |
| Autenticação | Firebase Authentication (e-mail e senha) |
| Dados | Cloud Firestore, com regras de segurança e índices versionados no repositório |
| Testes | Test runner nativo do Node (`node --test`) para as regras de domínio |
| Hospedagem | GitHub Pages ([ADR 0011](docs/adr/0011-github-pages-com-firebase.md)) |

## Como rodar localmente

### Pré-requisitos

- Node.js 22.18 ou superior (o `npm test` executa TypeScript direto no Node)
- npm

### Instalar e iniciar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Executa a verificação TypeScript e gera a build em `dist/` |
| `npm run preview` | Serve a build de produção localmente |
| `npm run lint` | Executa o linter Oxlint |
| `npm test` | Roda os testes das regras de domínio (`src/**/*.test.ts`) |

## Estrutura principal

```text
src/
  app/                 Rotas e layout da aplicação
  features/            Funcionalidades organizadas por domínio (auth, businesses, professionals,
                       services-catalog, customers, appointments, productivity)
  shared/              Componentes de interface, utilitários do Firebase e tipos compartilhados
public/                Ícones e arquivos estáticos
docs/                  Arquitetura, modelo de domínio, ADRs e documentação das features
firestore.rules        Regras de segurança do Firestore
firestore.indexes.json Índices compostos do Firestore
.github/workflows/     Publicação automática no GitHub Pages
```

## Documentação

| Arquivo | Conteúdo |
|---|---|
| [`METODOLOGIA.md`](METODOLOGIA.md) | Etapas do projeto e roadmap |
| [`docs/modelo-dominio.md`](docs/modelo-dominio.md) | Requisitos, entidades e regras de negócio |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Arquitetura, modelagem no Firestore e onde cada regra vive |
| [`docs/features/prototype/`](docs/features/prototype/) | Escopo das telas (Passe 1, protótipo) |
| [`docs/features/data/`](docs/features/data/) | Integração com o Firebase, feature a feature, com critérios de pronto e testes (Passe 2) |
| [`docs/adr/`](docs/adr/) | Decisões técnicas e suas justificativas |

O desenvolvimento seguiu **FDD** (*Feature-Driven Development*) adaptado: modelo de domínio
primeiro, depois entrega feature a feature — primeiro o protótipo navegável com dados em memória
([ADR 0006](docs/adr/0006-prototipo-antes-de-integracao-de-dados.md)), depois a troca, tela por
tela, pelo Firebase.

## Status

**Concluído.** As 13 features da integração de dados (`feat_data00` a `feat_data12`) estão
prontas, com os critérios de pronto marcados em cada documento de
[`docs/features/data/`](docs/features/data/). Os dados mockados foram removidos por completo.

Limitações conhecidas, assumidas no escopo:

- Sem notificações (e-mail, SMS ou WhatsApp) e sem controle financeiro.
- As telas não se atualizam sozinhas: mudanças feitas por outra conta aparecem ao recarregar ou
  navegar ([ADR 0003](docs/adr/0003-stack-front-end.md)).
- A Produtividade conta só atendimentos já realizados; não existe agendamento com data passada.
