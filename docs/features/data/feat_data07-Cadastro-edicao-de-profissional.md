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

## Ajustes fora de `services/`

- **`businessId` nas assinaturas.** `getProfessionalById`, `updateProfessional` e
  `updateProfessionalShifts` passam a receber `businessId` primeiro (o documento vive dentro de
  `businesses/{businessId}`). `useProfessionalForm` já tinha o id; `useMySchedule` passa a recebê-lo
  e o `MyScheduleScreen` o obtém com `useCurrentBusinessId` (para o profissional, é o
  `account.businessId`). Os dois hooks esperam o id chegar antes de ler.
- **Mensagens de erro compartilhadas.** O `toFriendlyError` da `feat_data00` sai do
  `firebaseAuthService` para `shared/lib/firebaseErrors.ts`, porque agora o cadastro de
  profissional também traduz erros do Auth ("Já existe uma conta com esse e-mail").
- **Formulário mostra o erro.** O `ProfessionalFormScreen` exibe a mensagem quando salvar falha, em
  vez de deixar a promessa rejeitada sem tratamento.
- **Efeito colateral até a `feat_data12`.** O `MyScheduleScreen` passa a ler a jornada do
  Firestore, mas a regra que deixa o **profissional** gravar a própria jornada só chega na
  `feat_data12`. Até lá, salvar a jornada por essa tela é recusado. (Resolvido na `feat_data12`.)

## Regras de segurança

A edição pelo dono já está liberada pela `feat_data06`, com `isValidProfessional`. Falta a
**criação**, que nasce sempre ativa:

```
match /businesses/{businessId}/professionals/{professionalId} {
  // read, update e delete como na feat_data06
  allow create: if request.auth != null && request.auth.uid == businessId
                && isValidProfessional(request.resource.data)
                && request.resource.data.active == true;
}
```

Falta também liberar o empreendimento a criar o `users/{uid}` do profissional. A base da `feat_data00` só permite o
autocadastro de `customer` e `business`; o bloco é **editado** (não duplicado), mantendo essa
condição e acrescentando o caminho do profissional:

```
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && (
                  (request.auth.uid == uid
                    && request.resource.data.keys().hasOnly(['type'])
                    && request.resource.data.type in ['customer', 'business'])
                  || (request.resource.data.keys().hasOnly(['type', 'businessId'])
                    && request.resource.data.type == 'professional'
                    && request.resource.data.businessId == request.auth.uid
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'business'
                    && existsAfter(/databases/$(database)/documents/businesses/$(request.auth.uid)/professionals/$(uid)))
                );
  allow update, delete: if false;
}
```

O `existsAfter` amarra o `users/{uid}` ao documento do profissional gravado no mesmo batch: o
empreendimento só cria o tipo de conta de quem ele de fato cadastrou como profissional.

## Índices

Nenhum.

## Remoção do mock

`mockProfessionals` sai do `mockDb.ts`: `getProfessionalById`, `createProfessional`,
`updateProfessional` e `updateProfessionalShifts` eram os últimos consumidores. Os tipos
`Professional`, `Shift` e `Weekday` passam para `shared/types/professional.ts`, porque são usados
por várias features (o helper `shiftsFor`, que só montava o mock, sai junto).

`registerProfessionalAccount` (do `mockAuthService`) já foi removido na `feat_data00`.

## Critério de pronto

- [x] Cadastrar profissional **não** desloga o empreendimento
- [x] Cadastrar duas vezes seguidas, sem recarregar a página, funciona (guarda do `getApps`)
- [x] Cadastrar depois de um hot reload funciona
- [x] O profissional criado consegue logar e cai em `/my-schedule`
- [x] Ele enxerga o próprio empreendimento (`businessId` correto em `users/{uid}`)
- [x] Editar não pede nem altera credencial
- [x] E-mail já usado mostra erro claro, sem deixar documento pela metade
- [x] Falha forçada no batch (ex.: regra negando) apaga a conta recém-criada — verificar no
      console do Authentication que ela não ficou órfã

Verificado em 16/11/2026 via Playwright, no Salão Tela: Fábio, Gabi e Hugo cadastrados (o Hugo
depois de um hot reload de `secondaryAuth.ts`), dono logado o tempo todo; Fábio editado (telefone e
terça) e logado com a senha original, caindo em `/my-schedule` e vendo a jornada editada;
`users/{uid}` com `businessId` do Salão Tela. Falha forçada: `createProfessional` com `serviceIds`
vazio, duas vezes com o mesmo e-mail — as duas recusadas por permissão (a segunda não acusou
"e-mail já existe", ou seja, a conta da primeira foi apagada).
