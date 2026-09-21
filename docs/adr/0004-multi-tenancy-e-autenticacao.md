# ADR 0004 — Multi-tenancy e autenticação de contas

**Data:** 2026-09-18
**Status:** Aceito
**Substitui:** as premissas P1, P2 e P3 de `docs/modelo-dominio.md` (seção 8)

---

## Contexto

O projeto nasceu com escopo de **salão único, sem autenticação, sem acesso do cliente** (premissas
P1, P2, P3 do modelo de domínio — decisão original registrada implicitamente, nunca em ADR próprio).

Essa premissa mudou: o objetivo agora é uma **plataforma** que atende **múltiplos salões e
barbearias** (multi-tenant), na qual:

- O **cliente** cria uma conta própria na plataforma e navega entre diferentes empreendimentos
  para agendar horários.
- O **empreendimento** (salão/barbearia) também tem uma conta própria, cadastra seus funcionários
  (profissionais) e os serviços que eles executam.

Isso reabre justamente as três premissas que o modelo de domínio original registrou como
explicitamente fechadas. Por isso vira ADR, não só uma edição silenciosa do documento.

---

## Decisão

### 1. Autenticação via Firebase Authentication

Dois tipos de conta, ambos autenticados por e-mail/senha via **Firebase Authentication**:

| Tipo de conta | Pode fazer |
|---|---|
| **Cliente** | Cadastrar-se, navegar entre empreendimentos, agendar horários |
| **Empreendimento** | Cadastrar-se, gerenciar seus profissionais, serviços e agenda |

O `uid` do Firebase Auth é a chave que liga a conta autenticada ao registro de domínio
correspondente (`clientes/{uid}` ou `empreendimentos/{uid}`).

Um documento auxiliar em `usuarios/{uid}` guarda **apenas** `{ tipo: "cliente" | "empreendimento" }`
— é o que a tela de login consulta primeiro para saber para onde rotear depois de autenticar.

### 2. Isolamento de dados por empreendimento (multi-tenancy)

`Profissional`, `Serviço` e `Agendamento` passam a existir **dentro** do empreendimento a quem
pertencem, como subcoleções:

```
empreendimentos/{empreendimentoId}
  profissionais/{id}
  servicos/{id}
  agendamentos/{id}
```

`Cliente` continua **global** (coleção raiz `clientes/{uid}`), porque a mesma pessoa agenda em
empreendimentos diferentes — a conta do cliente não pertence a nenhum salão específico.

Ver detalhamento completo da modelagem em `docs/arquitetura.md` (seção "Modelagem no Firestore").

### 3. Regra de negócio nova

**RN09 — Isolamento entre empreendimentos:** um agendamento só pode referenciar profissional e
serviço do **mesmo** empreendimento em que o agendamento está sendo criado. Consequência direta de
virar plataforma: sem essa regra, nada impede misturar dados de salões diferentes.

---

## Consequências

### Positivas

- O projeto passa a resolver o problema real declarado depois: uma plataforma que atende **vários**
  salões, não um sistema fechado para um único negócio.
- Subcoleção por empreendimento dá isolamento "de graça" nas consultas — buscar a agenda de um
  salão nunca varre dados de outro.
- `clientes/` global evita duplicar cadastro de cliente a cada salão que ele visita.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| **Regras de segurança do Firestore ficam bem mais importantes.** Sem backend, é a regra de segurança que impede um empreendimento ler/escrever dados de outro | Regras devem checar `request.auth.uid == empreendimentoId` no caminho da subcoleção antes de liberar escrita — a definir na Etapa 2 |
| **Um cliente cancelado/bloqueado por um empreendimento ainda existe globalmente** | Fora do escopo atual; se necessário, vira campo de bloqueio por empreendimento no futuro |
| **Duas telas de cadastro/login (cliente e empreendimento)** em vez de nenhuma | Aceito — é o custo direto de virar plataforma |
| **Mais uma coleção para orquestrar (`usuarios/`)** só para saber o tipo de conta | Necessário porque o Firestore não guarda metadado de "tipo" no próprio Firebase Auth sem Custom Claims (que exigiriam Cloud Functions — fora do escopo de "sem backend") |

---

## Alternativas consideradas

### Custom Claims no Firebase Auth (em vez de `usuarios/{uid}`)

Guardaria o tipo de conta (`cliente`/`empreendimento`) diretamente no token de autenticação.

**Rejeitada:** definir Custom Claims exige uma Cloud Function (Admin SDK), o que reintroduz
backend — contradiz o ADR 0002 (sem servidor próprio).

### Empreendimento como campo do Cliente (um único tipo de conta)

Uma única coleção de contas, com um campo booleano "é dono de empreendimento".

**Rejeitada:** cliente e empreendimento têm formulários de cadastro, dados e permissões
completamente diferentes. Modelar como o mesmo tipo forçaria campos opcionais e validações
condicionais que confundem mais do que ajudam.

### Coleções raiz com `empreendimentoId` como campo, em vez de subcoleção

Ex.: `profissionais/{id}` com campo `empreendimentoId`, filtrado por query.

**Rejeitada por ora:** funcionaria, mas exige lembrar de filtrar por `empreendimentoId` em toda
consulta e toda regra de segurança — um esquecimento vaza dado entre empreendimentos. A subcoleção
torna o isolamento estrutural, não uma convenção que depende de disciplina.

---

## Revisão

Reavaliar se o número de empreendimentos por cliente ou a necessidade de relatórios que cruzem
dados de vários empreendimentos (ex.: um painel para o dono da plataforma) tornar a subcoleção
inconveniente para consulta.
