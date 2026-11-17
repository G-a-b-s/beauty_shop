# feat_data00 — Autenticação (volta do Firebase Auth)

**Conta:** todas
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Reverte:** [ADR 0009](../../adr/0009-autenticacao-mockada-no-prototipo.md) (autenticação mockada no protótipo)
**Depende de:** nada — é a base de todas as outras
**Fornece:** `subscribeToAccount`, `login`, `signUp`, `logout`, os arquivos `firestore.rules` e
`firestore.indexes.json` e a sessão (`uid`, `type`, `businessId`) que todas as demais features consomem

---

## Objetivo

Religar o Firebase Authentication, desligado durante o protótipo, e passar a gravar/ler as contas
no Firestore. É a primeira integração porque **toda** consulta das outras features é escopada pelo
`uid` da sessão.

## O que muda no código

Um import em `auth/hooks/useAuth.ts`:

```diff
- from '../services/mockAuthService'
+ from '../services/firebaseAuthService'
```

O `firebaseAuthService.ts` já existe (preservado pelo ADR 0009) e precisa de um ajuste: expor
`subscribeToAccount(listener)` com o mesmo contrato do mock, envolvendo `onAuthStateChanged` +
`fetchAccount`.

Ajustes no serviço que mantêm o contrato do mock:

- **Cadastro sem corrida com o listener.** `createUserWithEmailAndPassword` dispara o
  `onAuthStateChanged` antes de `users/{uid}` existir. Enquanto o `signUp` está em andamento, o
  listener ignora esse disparo, e o próprio `signUp` avisa os inscritos ao terminar.
- **Cadastro atômico.** `users/{uid}` e o documento de dados são gravados num `writeBatch`. Se o
  batch falhar, a conta recém-criada é apagada com `deleteUser`, o mesmo padrão da `feat_data07`.
- **Sessão do profissional com `businessId`.** O `fetchAccount` devolve o `businessId` lido de
  `users/{uid}`, que é o que o `useCurrentBusinessId` usa.
- **Conta sem `users/{uid}`** (cadastro incompleto ou conta antiga): a sessão é encerrada e o
  listener recebe `null`, em vez de travar na tela de carregamento.
- **Mensagens em português.** Os códigos do Firebase (`auth/invalid-credential`,
  `auth/email-already-in-use`…) viram as mesmas mensagens que o mock exibia.

O tipo `SelfSignUpType` passa para `auth/types.ts`, para que `AuthScreen` e `useAuth` não dependam
do arquivo de serviço.

**Nada mais muda.** `useCurrentBusinessId` e `useCurrentProfessionalId` já leem a sessão — o `uid`
simplesmente passa a ser o do Firebase.

Enquanto as features seguintes não chegam, as demais telas continuam lendo o `mockDb`. Um
empreendimento cadastrado de verdade vê listas vazias (o `uid` dele não existe no mock), e o cliente
continua vendo os empreendimentos fictícios. É o estado esperado da transição.

## Dados no Firestore

| Caminho | Escrita | Leitura |
|---|---|---|
| `users/{uid}` | no cadastro: `{ type }` | no login, para rotear |
| `customers/{uid}` | no cadastro de cliente: nome, telefone, cpf | `feat_data05` |
| `businesses/{uid}` | no cadastro de empreendimento: nome, telefone, cnpj, endereço, cidade, `active: true` | `feat_data01`, `feat_data02` |

Para conta de profissional, `users/{uid}` guarda também `businessId` — necessário para montar o
caminho da subcoleção onde o documento dele vive ([ADR 0007](../../adr/0007-profissional-como-conta.md)).
Quem grava esse documento é a `feat_data07`; aqui só o **login** dele precisa funcionar.

## Regras de segurança

Cria `firestore.rules` com a base — as features seguintes acrescentam as suas:

```
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && request.auth.uid == uid
                && request.resource.data.keys().hasOnly(['type'])
                && request.resource.data.type in ['customer', 'business'];
  allow update, delete: if false;
}

match /customers/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && request.auth.uid == uid
                && request.resource.data.keys().hasOnly(['name', 'phone', 'cpf'])
                && request.resource.data.keys().hasAll(['name', 'phone', 'cpf']);
  allow update: if request.auth != null && request.auth.uid == uid
                && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['name', 'phone']);
  allow delete: if false;
}

match /businesses/{businessId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == businessId
                && request.resource.data.keys()
                     .hasOnly(['name', 'phone', 'cnpj', 'address', 'city', 'active'])
                && request.resource.data.keys()
                     .hasAll(['name', 'phone', 'cnpj', 'address', 'city', 'active'])
                && request.resource.data.active == true;
  allow update: if request.auth != null && request.auth.uid == businessId;
  allow delete: if false;
}
```

`users` só aceita, no autocadastro, `{ type }` com `customer` ou `business`. Sem essa validação,
qualquer conta poderia gravar no próprio `users/{uid}` o tipo `professional` com o `businessId` de
outro empreendimento — e as regras seguintes (como a de agendamentos da `feat_data03`) decidem
permissões com base nesse documento. O caminho do profissional entra na `feat_data07`, criado pelo
empreendimento.

`businesses` é legível por qualquer autenticado porque o cliente precisa navegar entre
empreendimentos (`feat_data01`); só o dono escreve. A criação grava exatamente os campos do
cadastro, com `active: true`. A atualização fica só com a checagem de dono, porque nenhuma feature
edita o empreendimento ainda.

`customers` já nasce com `write` desmembrado em `create`/`update`/`delete`: no cadastro grava
exatamente nome, telefone e CPF; depois disso, só nome e telefone mudam (`feat_data05`). Fica
definido aqui, e não na `feat_data05`, porque as regras são somadas — um `write` genérico nesta
base continuaria liberando a troca do CPF mesmo com uma regra restritiva escrita depois.

## Remoção do mock

- `mockAuthService.ts` é apagado
- `mockAccounts` sai do `mockDb.ts`
- A caixa de contas de demonstração sai da `AuthScreen`
- `registerProfessionalAccount` sai junto com o `mockAuthService`; o `createProfessional` mockado
  deixa de registrar credencial. Até a `feat_data07`, o profissional cadastrado pela tela não
  consegue logar

## Verificação

As regras podem ser testadas sem publicar, no Firebase Emulator (Auth + Firestore, projeto
`demo-*`, sem login). Os cenários conferidos: cadastro de cliente e de empreendimento em batch;
leitura do próprio `users`; troca de nome e telefone permitida e troca de CPF negada; negados o
autocadastro como `professional`, campos extras em `users`, `customers` e `businesses`,
empreendimento nascendo inativo, escrita no documento de outro `uid`, leitura de `users` e
`customers` de outra conta e leitura de `businesses` sem autenticação.

## Critério de pronto

- [x] Cadastro de cliente e de empreendimento cria `users/{uid}` + o documento de dados
- [x] Login roteia para a home correta de cada tipo de conta
- [x] Sessão sobrevive a recarregar a página
- [ ] Conta de profissional (criada pela `feat_data07`) consegue logar e é roteada para `/my-schedule`
  — verificado quando a `feat_data07` for integrada
- [x] `firestore.rules` publicado, com o modo de teste desligado
