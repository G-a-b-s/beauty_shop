# ADR 0009 — Autenticação mockada durante o protótipo

**Data:** 2026-09-18
**Status:** Aceito
**Complementa:** [ADR 0006](0006-prototipo-antes-de-integracao-de-dados.md) (protótipo antes da integração)
**Afeta temporariamente:** [ADR 0004](0004-multi-tenancy-e-autenticacao.md) e [ADR 0007](0007-profissional-como-conta.md)

---

## Contexto

A autenticação foi construída com Firebase Authentication **real** na Etapa 2, antes de o ADR 0006
dividir o desenvolvimento em dois passes (protótipo mockado → integração de dados). Isso deixou o
protótipo com um pé em cada barco, e criou três problemas concretos:

1. **O `uid` real não existe no mock.** Uma conta de empreendimento autenticada no Firebase tem um
   `uid` como `TKGGp0ttt...`, enquanto o mock usa `business-1`. Para as telas não ficarem vazias,
   os hooks `useCurrentBusinessId`/`useCurrentProfessionalId` devolviam um id demo fixo.
2. **O isolamento multi-tenant não era testável.** Com todo empreendimento mapeando para o mesmo
   id demo, duas contas diferentes viam exatamente os mesmos profissionais e a mesma agenda — ou
   seja, o protótipo **não validava** a regra de acesso que o ADR 0006 diz existir para validar.
3. **Duas das doze telas eram inalcançáveis.** Nada no sistema gravava `users/{uid}` com
   `type: "professional"` (pelo ADR 0007, quem cria a credencial é o empreendimento, e isso é
   trabalho de `feat_data07`). Sem nenhuma conta de profissional possível, `/my-schedule` e
   `/my-shift` não podiam ser abertas por ninguém.

---

## Decisão

Durante o passe de protótipo, a autenticação também é **mockada**: `src/features/auth/services/mockAuthService.ts`
substitui o Firebase Auth, mantendo a mesma API (`subscribeToAccount`, `login`, `signUp`, `logout`).

O serviço real continua no repositório, intacto, em
`src/features/auth/services/firebaseAuthService.ts` — a volta é a **troca de um import** em
`useAuth`, exatamente o padrão que o ADR 0006 define para todas as outras features.

### Contas de demonstração

| E-mail | Senha | Tipo | Id |
|---|---|---|---|
| `cliente@demo.com` | `123456` | Cliente | `customer-demo` |
| `salao@demo.com` | `123456` | Empreendimento | `business-1` |
| `ana@demo.com` | `123456` | Profissional | `professional-1` (do `business-1`) |

O id da conta **é** o id da entidade no mock. É isso que elimina o mapeamento falso: os hooks
`useCurrentBusinessId`/`useCurrentProfessionalId` passam a ler a sessão de verdade.

### Cadastro também é mockado

Criar conta pela tela adiciona a conta ao mock. Um empreendimento novo nasce **vazio** — sem
profissionais, sem serviços — como aconteceria de verdade, e completamente isolado dos demais.

### Credencial do profissional (fecha o ADR 0007)

O cadastro de profissional (`feat_prot07`) passa a registrar também a credencial de acesso dele no
mock. Com isso o ciclo completo do ADR 0007 fica testável no protótipo: o empreendimento cadastra
o profissional com e-mail/senha → o profissional loga → vê a própria agenda e ajusta a própria
jornada.

---

## Consequências

### Positivas

- O isolamento entre empreendimentos passa a ser **real e testável** no protótipo: duas contas
  veem dados distintos, que é justamente o que o ADR 0006 se propõe a validar cedo.
- As doze telas ficam alcançáveis, incluindo o fluxo do profissional.
- Some o único trecho de "dado real" que restava no passe de protótipo — o pacote 1 fica coerente
  de ponta a ponta, como o ADR 0006 descreve.
- A restrição técnica da segunda instância do Firebase App (ADR 0007) deixa de bloquear a
  validação do fluxo: continua sendo trabalho de `feat_data07`, mas agora só da **integração**,
  não do desenho da tela.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| A autenticação real (já funcionando e testada na Etapa 2) sai temporariamente do ar | O código não foi apagado, só desligado: `firebaseAuthService.ts` segue no repositório e a volta é um import |
| Senhas em texto puro no mock | São credenciais de demonstração de um protótipo, exibidas na própria tela de login; nenhum dado real trafega |
| O projeto Firebase (Auth + Firestore) fica ocioso durante o pacote 1 | Já está configurado e validado; volta a ser usado no pacote 2 |

---

## Alternativas consideradas

**Manter o Firebase Auth e semear dados mockados para o `uid` real.** Resolveria o problema 1 e
parte do 2, mas não o 3 — nenhuma conta de profissional poderia existir sem implementar a criação
de credencial via segunda instância do Firebase App, que é trabalho de `feat_data07`. Faria parte
da integração vazar para dentro do passe de protótipo.

**Deixar como estava e corrigir só na `feat_data`.** Rejeitada: o protótipo passaria a fase inteira
sem exercitar o isolamento multi-tenant nem o fluxo do profissional — perderia exatamente os
problemas que ele existe para encontrar cedo.

---

## Reversão

Em `feat_data01`, `useAuth` volta a importar de `firebaseAuthService` e as contas mockadas são
descartadas. Os hooks `useCurrentBusinessId`/`useCurrentProfessionalId` **não mudam** — já leem a
sessão, e o `uid` passará a ser o do Firebase.
