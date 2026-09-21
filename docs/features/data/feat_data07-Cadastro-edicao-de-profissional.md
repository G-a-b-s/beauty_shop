# feat_data07 — Cadastro/edição de profissional

**Conta:** Empreendimento
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot07`](../prototype/feat_prot07-Cadastro-edicao-de-profissional.md)
**Depende de:** `feat_data06` (escrita na subcoleção) e `feat_data02` (reutiliza
`listServicesForBusiness` para os checkboxes)
**Fornece:** `createProfessional`, `updateProfessional`, `getProfessionalById` e
`shared/lib/secondaryAuth.ts`. O `updateProfessionalShifts` é reutilizado por `feat_data12`

---

## Objetivo

Gravar o profissional e — a parte difícil — **criar a credencial de acesso dele** sem derrubar a
sessão do empreendimento que está fazendo o cadastro.

## A restrição técnica (ADR 0007)

`createUserWithEmailAndPassword` **troca a sessão ativa** para o usuário recém-criado. Chamada
direto, ela deslogaria o empreendimento no meio do cadastro e logaria como o profissional.

**Solução, sem backend:** uma segunda instância do Firebase App, isolada, só para criar a conta.

```ts
// shared/lib/secondaryAuth.ts
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { firebaseConfig } from './firebase'

const SECONDARY_APP_NAME = 'secondary'

export function getSecondaryAuth() {
  const app = getApps().some((entry) => entry.name === SECONDARY_APP_NAME)
    ? getApp(SECONDARY_APP_NAME)
    : initializeApp(firebaseConfig, SECONDARY_APP_NAME)

  return getAuth(app)
}
```

> **A guarda `getApps()` não é opcional.** `initializeApp` com um nome que já existe lança
> `Firebase: Firebase App named 'secondary' already exists`. Sem a guarda, funciona na primeira
> execução e quebra no primeiro hot reload do Vite — sintoma confuso, que só aparece em
> desenvolvimento.

Isso exige que `shared/lib/firebase.ts` passe a **exportar o `firebaseConfig`**, hoje interno.

A sessão principal não é tocada. Mantém o ADR 0002 (sem servidor próprio) — a alternativa seria
uma Cloud Function com o Admin SDK.

## Ordem das escritas, e o que fazer quando falha no meio

O `uid` da conta é o id do documento ([ADR 0007](../../adr/0007-profissional-como-conta.md)), então
a credencial vem primeiro. As duas escritas seguintes vão num **batch**, para não existir estado
onde o profissional tem documento mas não tem tipo de conta (ou o contrário):

```ts
const secondaryAuth = getSecondaryAuth()
const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)

try {
  const batch = writeBatch(db)
  batch.set(doc(db, 'businesses', businessId, 'professionals', credential.user.uid), {
    name, phone, serviceIds, shifts, active: true,
  })
  batch.set(doc(db, 'users', credential.user.uid), { type: 'professional', businessId })
  await batch.commit()
} catch (error) {
  await deleteUser(credential.user)
  throw error
} finally {
  await signOut(secondaryAuth)
}
```

### Por que a compensação funciona

Sem backend não há transação cobrindo Auth + Firestore, então a falha precisa ser **desfeita**, não
só reportada. `deleteUser` exige autenticação recente — e a conta acabou de ser criada nesta mesma
instância secundária, então a credencial ainda está válida. É a única janela em que o cliente
consegue apagar a própria conta órfã.

O `finally` roda depois do `deleteUser`; se a conta já foi apagada, o `signOut` simplesmente não
tem sessão para encerrar e resolve sem erro.

**Consequência:** sobra apenas um modo de falha não coberto — a rede cair entre o
`createUserWithEmailAndPassword` e o `deleteUser`. Nesse caso resta uma conta no Authentication sem
documento nenhum; ela não consegue logar em lugar nenhum (o `fetchAccount` não acha `users/{uid}`)
e precisa ser removida pelo console. Aceitável no escopo do protótipo.

## Edição

Não mexe em credencial — só `updateDoc` de nome, telefone, `serviceIds[]` e `shifts[]`. É por isso
que os campos de acesso não aparecem no modo edição (`feat_prot07`).

`updateProfessionalShifts` é extraído como método próprio aqui, porque a `feat_data12` grava
**somente** as jornadas quando o profissional edita a própria escala.

## Regras de segurança

A regra de `professionals` (`feat_data02`) já permite a escrita pelo dono. Falta liberar o
empreendimento a criar o `users/{uid}` do profissional — a base da `feat_data00` só permitia
`request.auth.uid == uid`:

```
match /users/{uid} {
  allow read: if request.auth.uid == uid;
  allow create: if request.auth.uid == uid
                || (request.resource.data.type == 'professional'
                    && request.auth.uid == request.resource.data.businessId);
  allow update, delete: if false;
}
```

## Índices

Nenhum.

## Remoção do mock

`registerProfessionalAccount` (do `mockAuthService`) já terá sido removido na `feat_data00`.

## Critério de pronto

- [ ] Cadastrar profissional **não** desloga o empreendimento
- [ ] Cadastrar duas vezes seguidas, sem recarregar a página, funciona (guarda do `getApps`)
- [ ] Cadastrar depois de um hot reload funciona
- [ ] O profissional criado consegue logar e cai em `/my-schedule`
- [ ] Ele enxerga o próprio empreendimento (`businessId` correto em `users/{uid}`)
- [ ] Editar não pede nem altera credencial
- [ ] E-mail já usado mostra erro claro, sem deixar documento pela metade
- [ ] Falha forçada no batch (ex.: regra negando) apaga a conta recém-criada — verificar no
      console do Authentication que ela não ficou órfã
