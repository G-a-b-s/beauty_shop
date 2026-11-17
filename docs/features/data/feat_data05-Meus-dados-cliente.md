# feat_data05 — Meus dados (cliente)

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot05`](../prototype/feat_prot05-Meus-dados-cliente.md)
**Depende de:** `feat_data00` (o documento `customers/{uid}` já é criado no cadastro)
**Fornece:** `getCustomerProfile`, `updateCustomerProfile`, `refreshAccount`

---

## Objetivo

Ler e atualizar `customers/{uid}`. É a feature mais simples do pacote — o documento já existe
desde o cadastro (`feat_data00`), então aqui é só leitura e `updateDoc`.

## O que muda no código

Só `customers/services/customerService.ts`:

| Método | Consulta |
|---|---|
| `getCustomerProfile` | `getDoc(doc(db, 'customers', uid))` |
| `updateCustomerProfile` | `updateDoc` com `{ name, phone }` |

A assinatura muda: o mock recebia `fallbackName`/`fallbackEmail` para semear um cliente
inexistente. Com dado real o documento sempre existe, então esses parâmetros somem.
`getCustomerProfile` devolve `undefined` se o documento não existir, e `updateCustomerProfile`
não devolve nada (o hook já sabe os valores que gravou).

### Exceção: hook e componente mudam

- **`useCustomerProfile(customerId)`** perde os dois argumentos de fallback e espera o `uid` chegar
  antes de ler (enquanto a conta carrega, o `uid` é vazio).
- **E-mail** não está em `customers/{uid}`, então o tipo `Customer` perde o campo `email` e o
  `CustomerProfileScreen` mostra o e-mail da conta (`account.email`, vindo do Firebase Auth).
- O componente ganha estado de "Salvando…", mensagem de erro e o caso "não foi possível carregar".

### Nome da conta: `refreshAccount`

O `AuthenticatedAccount.name` é lido uma vez, quando o login é resolvido. Depois de salvar, ele
ficaria com o nome antigo, o que tem dois efeitos:

- o cabeçalho do `AppLayout` continua mostrando o nome velho;
- **o próximo agendamento é recusado**: a `feat_data03` grava `customerName` a partir da conta, e
  a regra exige `customerName == customers/{uid}.name`.

Por isso `auth/services/firebaseAuthService.ts` ganha `refreshAccount()`: relê a conta logada e
avisa os ouvintes do `subscribeToAccount`. O `save` do hook chama depois do `updateDoc`. Custa
duas leituras, só ao salvar.

## E-mail e CPF

Continuam somente leitura:

- **E-mail** mora no Firebase Auth, não em `customers/{uid}`. Trocá-lo é `updateEmail()` +
  reautenticação — fluxo próprio, fora de escopo (ver `feat_prot05`).
- **CPF** é identificador; não muda após o cadastro.

O `updateDoc` grava **apenas** `name` e `phone` — e a regra de segurança garante isso também no
servidor: mesmo pelo console, o cliente não consegue sobrescrever o próprio `cpf`.

## Regras de segurança

Já coberto pela base da [`feat_data00`](feat_data00-Autenticacao.md#regras-de-segurança), que
define `customers/{uid}` com `update` restrito:

```
allow update: if request.auth.uid == uid
              && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['name', 'phone']);
```

`diff().affectedKeys()` devolve os campos que a escrita **muda**. Restringir a `name` e `phone`
bloqueia a troca do `cpf` e a inclusão de campos novos no documento. Mesmo padrão da regra de
`professionals` na [`feat_data12`](feat_data12-Minha-jornada-e-folgas.md#regras-de-segurança).

## Índices

Nenhum — leitura por id.

## Remoção do mock

`mockCustomers` e `seedCustomer` saem do `mockDb.ts`. O tipo `Customer` passa a ser definido em
`customers/types.ts`, sem o campo `email`.

## Critério de pronto

- [x] Formulário abre preenchido com o dado do Firestore
- [x] Salvar persiste e sobrevive a recarregar a página
- [x] O nome atualizado aparece no cabeçalho do `AppLayout`
- [x] E-mail e CPF seguem bloqueados na tela
- [x] Depois de trocar o nome, um novo agendamento é aceito e grava o nome novo
- [x] Pelo console, a tentativa de alterar o `cpf` ou acrescentar outro campo é recusada

Verificado em 16/11/2026: tela via Playwright (Cliente Tela: editar, recarregar, cabeçalho, agendar
em 18/11 sem recarregar depois de trocar o nome) e script de regras com 6/6 verificações OK
(cpf, cpf junto com nome, campo novo e leitura de outro cliente recusados; nome e telefone aceitos).
