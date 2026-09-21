# feat_data05 — Meus dados (cliente)

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot05`](../prototype/feat_prot05-Meus-dados-cliente.md)
**Depende de:** `feat_data00` (o documento `customers/{uid}` já é criado no cadastro)
**Fornece:** `getCustomerProfile`, `updateCustomerProfile`

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
inexistente. Com dado real o documento sempre existe, então esses parâmetros somem — e o
`CustomerProfileScreen` para de passá-los.

> Esta é a **única** feature do pacote que altera algo fora de `services/`, porque a assinatura do
> método muda. A mudança no componente é remover dois argumentos.

## E-mail e CPF

Continuam somente leitura:

- **E-mail** mora no Firebase Auth, não em `customers/{uid}`. Trocá-lo é `updateEmail()` +
  reautenticação — fluxo próprio, fora de escopo (ver `feat_prot05`).
- **CPF** é identificador; não muda após o cadastro.

O `updateDoc` grava **apenas** `name` e `phone`. A regra de segurança não impede o cliente de
sobrescrever o próprio `cpf` pelo console — limitação conhecida do desenho sem backend
(`docs/arquitetura.md`, seção 6).

## Regras de segurança

Já coberto pela base da `feat_data00` (`customers/{uid}` só pelo dono).

## Índices

Nenhum — leitura por id.

## Remoção do mock

`mockCustomers` e `seedCustomer` saem do `mockDb.ts`.

## Critério de pronto

- [ ] Formulário abre preenchido com o dado do Firestore
- [ ] Salvar persiste e sobrevive a recarregar a página
- [ ] O nome atualizado aparece no cabeçalho do `AppLayout`
- [ ] E-mail e CPF seguem bloqueados na tela
