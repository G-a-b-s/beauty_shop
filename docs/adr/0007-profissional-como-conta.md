# ADR 0007 — Profissional como terceiro tipo de conta

**Data:** 2026-09-18
**Status:** Aceito
**Estende:** [ADR 0004](0004-multi-tenancy-e-autenticacao.md) (multi-tenancy e autenticação)

---

## Contexto

O ADR 0004 definiu dois tipos de conta: **cliente** e **empreendimento**. `Profissional` era só
dado gerenciado pelo empreendimento, sem login próprio.

Decisão revista: o profissional também precisa **acessar o sistema**, para ver sua própria agenda
(dia/semana/mês) e ajustar sua jornada e folgas. Isso exige um terceiro tipo de conta.

**Diferença chave em relação aos outros dois tipos:** cliente e empreendimento se **autocadastram**
(têm CPF/CNPJ próprio, informado no cadastro). O profissional **não** — ele já existe como dado
cadastrado pelo empreendimento antes de ter qualquer conta.

---

## Decisão

### Quem cria a credencial do profissional

O **empreendimento** define e-mail e senha do profissional no momento do cadastro (opção validada
com o autor: nenhuma tela de autocadastro para profissional — só tela de login).

### Modelagem

`AccountType` ganha um terceiro valor: `'professional'`.

O documento do profissional passa a usar o **uid do Firebase Auth** como id — mesmo padrão já
usado para `customers/{uid}` e `businesses/{uid}` (ADR 0004):

```
businesses/{businessId}/professionals/{uid}
```

`users/{uid}` (mapeamento de tipo de conta) precisa guardar também o `businessId`, porque só o
`uid` do profissional não basta para achar seu documento (ele está numa subcoleção, não numa
coleção raiz):

```ts
type UserRecord =
  | { type: 'customer' }
  | { type: 'business' }
  | { type: 'professional'; businessId: string }
```

### Restrição técnica: criar conta a partir de uma sessão já logada

O Firebase Authentication no cliente **troca a sessão ativa** para o usuário recém-criado ao
chamar `createUserWithEmailAndPassword` — criar o profissional autenticaria como ele, derrubando
a sessão do empreendimento que estava fazendo o cadastro.

**Mitigação:** usar uma **segunda instância do Firebase App** (`initializeApp(config, "secondary")`)
só para criar a credencial do profissional, sem afetar a sessão principal do empreendimento. Não
precisa de Cloud Function nem backend — resolve inteiramente no client SDK, mantendo o ADR 0002
(sem servidor próprio).

Esse detalhe é de **integração de dados** (`feat_data`, [ADR 0006](0006-prototipo-antes-de-integracao-de-dados.md)),
não do protótipo mockado — a tela do protótipo só simula o formulário.

---

## Consequências

### Positivas

- Profissional ganha visão da própria agenda sem precisar pedir para o empreendimento — reduz
  fricção no fluxo real de um salão.
- Reuso do padrão "documento com id = uid" já estabelecido para as outras duas contas.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| Terceiro branch de roteamento pós-login na aplicação | `useAuth` já resolve `type` via `users/{uid}`; só adiciona um caso |
| Criar conta de profissional exige a instância secundária do Firebase App (mais um arquivo em `shared/lib/`) | Documentar claramente em `feat_data` quando chegar a vez dessa tela |
| Se o empreendimento errar o e-mail/senha do profissional, não há fluxo de "esqueci minha senha" ainda | Fora do escopo desta decisão; considerar `sendPasswordResetEmail` do Firebase Auth quando a tela de login do profissional for implementada de verdade |

---

## Alternativas consideradas

**Profissional acessa com um PIN/código, sem conta separada no Firebase Auth.** Rejeitada: PIN
sem Firebase Auth não teria `request.auth.uid` nas regras de segurança do Firestore — não daria
para restringir o que o profissional pode ler/escrever de forma confiável sem backend.

**Profissional se autocadastra e depois é vinculado por convite.** Rejeitada pelo autor: mais
telas e mais um fluxo de vínculo, sem ganho relevante para o escopo do estudo.
