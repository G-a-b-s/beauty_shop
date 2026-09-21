# Beauty Shop

Plataforma Web para Gestão Integrada de Agendamentos, Escalas e Produtividade de Profissionais em
Salões de Beleza e Barbearias.

Projeto de estudo. É uma **SPA** (*single-page application*) em React, sem backend próprio — toda
a lógica roda no front-end, com o Firebase como camada de dados e de autenticação. O objetivo é
demonstrar o **fluxo** de uma plataforma multi-tenant de gestão de salões, não entregar um produto
pronto para produção.

A plataforma atende dois tipos de conta:

- **Empreendimento** (salão/barbearia) — cadastra-se, gerencia seus profissionais, serviços e
  agenda.
- **Cliente** — cadastra-se uma vez e agenda em qualquer empreendimento cadastrado na plataforma.

---

## O que o sistema faz

- **Contas** — cadastro e login separados para empreendimento e para cliente (Firebase Auth)
- **Agendamentos** — marcação de horários de clientes, com validação automática de conflito
- **Escalas** — jornada semanal e folgas de cada profissional
- **Disponibilidade** — cálculo dos horários livres a partir da escala e dos agendamentos
- **Produtividade** — volume de atendimentos e taxa de ocupação por profissional

O problema de origem: pequenos salões que ainda usam agenda de papel ou planilha, sujeitos a
agendamento duplicado e informação desatualizada.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | React + TypeScript |
| Build | Vite (SPA) |
| Estilo | Tailwind CSS |
| Dados | Firebase — Cloud Firestore |
| Autenticação | Firebase Authentication |
| Hospedagem | GitHub Pages (protótipo) · Firebase Hosting (previsto para o pacote 2) |

Sem servidor próprio: o React conversa diretamente com o Firestore.

---

## Escopo

Delimitações assumidas para manter o projeto enxuto:

- Multi-tenant — vários empreendimentos, dados isolados entre eles ([ADR 0004](docs/adr/0004-multi-tenancy-e-autenticacao.md))
- Autenticação simples (e-mail/senha) para as contas de cliente e de empreendimento
- Sem módulo financeiro
- Sem notificações (e-mail, SMS, WhatsApp)

Como não há backend, as validações são de front-end — servem à consistência do fluxo, não à
segurança.

---

## Como rodar o projeto

### Pré-requisitos

- Node.js e npm instalados

### 1. Instalar as dependências

```bash
npm install
```

### 2. Configurar as credenciais do Firebase

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Abra o `.env` e preencha com as credenciais do seu projeto Firebase (Console → **Project
settings** → **General** → seção "Your apps"):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

O `.env` é local e nunca é versionado (está no `.gitignore`).

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Gera a build de produção em `dist/` |
| `npm run preview` | Serve a build de produção localmente |
| `npm run lint` | Roda o linter (oxlint) |

---

## Documentação

| Arquivo | Conteúdo |
|---|---|
| [`METODOLOGIA.md`](METODOLOGIA.md) | Como o projeto é conduzido e em que etapa está |
| [`PUBLICAR.md`](PUBLICAR.md) | Passo a passo para publicar o protótipo no GitHub Pages |
| [`Introducao.md`](Introducao.md) | Fundamentação e contexto do problema |
| [`docs/modelo-dominio.md`](docs/modelo-dominio.md) | Entidades, requisitos e regras de negócio |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Camadas, estrutura de pastas e modelagem no Firestore |
| [`docs/adr/`](docs/adr/) | Registro das decisões técnicas e suas justificativas |

O desenvolvimento segue **FDD** (*Feature-Driven Development*) adaptado: modelo de domínio
primeiro, depois entrega feature a feature.

---

## Status

Em desenvolvimento — modelo de domínio e arquitetura definidos, implementação a iniciar.
Acompanhe a etapa atual no topo do [`METODOLOGIA.md`](METODOLOGIA.md).
