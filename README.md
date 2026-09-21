# Beauty Shop

Protótipo navegável de uma plataforma web para gestão de agendamentos, profissionais, serviços,
escalas e produtividade em salões de beleza e barbearias.

É uma **SPA** (*single-page application*) em React. Nesta etapa, a autenticação e os dados são
mockados no front-end para permitir a demonstração dos fluxos antes da integração com o Firebase.
Não é um produto pronto para produção.

## Demonstração

O protótipo é publicado no GitHub Pages:

**https://g-a-b-s.github.io/beauty_shop/**

### Contas de demonstração

Todas usam a senha `123456`:

| E-mail | Perfil | Tela inicial |
|---|---|---|
| `cliente@demo.com` | Cliente | Empreendimentos |
| `salao@demo.com` | Empreendimento | Profissionais |
| `ana@demo.com` | Profissional | Minha agenda |

Também é possível criar uma conta de cliente ou empreendimento pela tela de login. Como os dados
do protótipo ficam em memória, contas, agendamentos e alterações feitas durante a demonstração
voltam ao estado inicial quando a página é recarregada.

## O que já está disponível

### Cliente

- Lista de empreendimentos ativos
- Detalhes de um empreendimento
- Consulta de serviços e profissionais
- Novo agendamento com validação de disponibilidade e conflitos
- Lista de próximos agendamentos e histórico
- Edição dos próprios dados

### Empreendimento

- Cadastro, edição e listagem de profissionais
- Cadastro e edição de serviços
- Agenda dos agendamentos
- Jornada semanal e folgas dos profissionais
- Indicadores de produtividade e taxa de ocupação

### Profissional

- Minha agenda de atendimentos
- Minha jornada semanal e folgas

Os três perfis são protegidos por rotas próprias. Ao acessar uma rota incompatível, o sistema
redireciona para a tela inicial do perfil autenticado.

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript |
| Build | Vite (SPA) |
| Estilo | Tailwind CSS |
| Navegação | React Router |
| Dados atuais | Mock em memória |
| Autenticação atual | Mock local |
| Integração planejada | Firebase Authentication e Cloud Firestore |
| Hospedagem | GitHub Pages |

O Firebase continua preparado na arquitetura para a próxima etapa, mas não é necessário para rodar
o protótipo atual..

## Como rodar localmente

### Pré-requisitos

- Node.js 20 ou superior
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

Não é necessário criar um arquivo `.env` para executar o protótipo atual. As variáveis de Firebase
em [`.env.example`](.env.example) serão usadas quando a integração real for ativada.

## Estrutura principal

```text
src/
  app/                 Rotas e layout da aplicação
  features/            Funcionalidades organizadas por domínio
  shared/              Componentes, hooks e dados compartilhados
public/                Ícones e arquivos estáticos
docs/                  Arquitetura, modelo, ADRs e requisitos
.github/workflows/     Publicação automática no GitHub Pages
```

## Documentação

| Arquivo | Conteúdo |
|---|---|

| [`METODOLOGIA.md`](METODOLOGIA.md) | Etapas do projeto e roadmap |
| [`docs/modelo-dominio.md`](docs/modelo-dominio.md) | Entidades, requisitos e regras de negócio |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Arquitetura e organização do código |
| [`docs/features/prototype/`](docs/features/prototype/) | Escopo das telas do protótipo |
| [`docs/features/data/`](docs/features/data/) | Funcionalidades previstas para a integração de dados |
| [`docs/adr/`](docs/adr/) | Decisões técnicas e suas justificativas |

O desenvolvimento segue **FDD** (*Feature-Driven Development*) adaptado: modelo de domínio
primeiro, depois entrega feature a feature.

## Status

**Protótipo navegável publicado.** As principais telas e fluxos dos perfis cliente,
empreendimento e profissional estão implementados com dados mockados. A próxima etapa é substituir
gradualmente os serviços mockados por persistência e autenticação reais.
