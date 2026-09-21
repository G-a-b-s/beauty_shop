# feat_data00 — Autenticação (volta do Firebase Auth)

**Conta:** todas
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Reverte:** [ADR 0009](../../adr/0009-autenticacao-mockada-no-prototipo.md) (autenticação mockada no protótipo)
**Depende de:** nada — é a base de todas as outras
**Fornece:** `subscribeToAccount`, `login`, `signUp`, `logout`, o arquivo `firestore.rules` e a
sessão (`uid`, `type`, `businessId`) que todas as demais features consomem

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

**Nada mais muda.** `useCurrentBusinessId` e `useCurrentProfessionalId` já leem a sessão — o `uid`
simplesmente passa a ser o do Firebase.

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
  allow read: if request.auth.uid == uid;
  allow create: if request.auth.uid == uid;
  allow update, delete: if false;
}

match /customers/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /businesses/{businessId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth.uid == businessId;
  allow delete: if false;
}
```

`businesses` é legível por qualquer autenticado porque o cliente precisa navegar entre
empreendimentos (`feat_data01`); só o dono escreve.

## Remoção do mock

- `mockAuthService.ts` é apagado
- `mockAccounts` sai do `mockDb.ts`
- A caixa de contas de demonstração sai da `AuthScreen`

## Critério de pronto

- [ ] Cadastro de cliente e de empreendimento cria `users/{uid}` + o documento de dados
- [ ] Login roteia para a home correta de cada tipo de conta
- [ ] Sessão sobrevive a recarregar a página
- [ ] Conta de profissional (criada pela `feat_data07`) consegue logar e é roteada para `/my-schedule`
- [ ] `firestore.rules` publicado, com o modo de teste desligado
