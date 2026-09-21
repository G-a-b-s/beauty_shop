# feat_data12 — Minha jornada e folgas (profissional)

**Conta:** Profissional
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot12`](../prototype/feat_prot12-Minha-jornada-e-folgas.md)
**Depende de:** `feat_data03` (`listTimeOffForProfessional`) e `feat_data07`
(`updateProfessionalShifts`, `getProfessionalById`)
**Fornece:** `addTimeOff`, `removeTimeOff`

---

## Objetivo

Permitir que o profissional altere a própria jornada semanal e cadastre folgas. Última feature do
pacote — e a que fecha o ciclo: o que ele muda aqui reflete imediatamente nos horários livres que o
cliente vê na `feat_data03`.

## O que muda no código

Só `professionals/services/professionalService.ts`:

| Método | Consulta | Origem |
|---|---|---|
| `getProfessionalById` | `getDoc` no documento do profissional (traz `shifts[]` embutidas) | `feat_data07` |
| `updateProfessionalShifts` | `updateDoc` em `{ shifts }` | `feat_data07` |
| `listTimeOff` | subcoleção `timeOff` | `feat_data03` (`listTimeOffForProfessional`) |
| `addTimeOff` | `addDoc` na subcoleção | **novo aqui** |
| `removeTimeOff` | `deleteDoc` na subcoleção | **novo aqui** |

Dos cinco métodos, **três já existem**. Só as duas escritas de folga são novas.

## Folga é a exceção da exclusão lógica

Todo o resto do sistema usa exclusão lógica (`active: false`), porque há histórico apontando. Folga
não: ela não é referenciada por nada, e uma folga removida não precisa deixar rastro. `deleteDoc`
é o certo aqui.

## Quem pode escrever

Tanto o profissional (própria jornada) quanto o empreendimento (jornada inicial, na `feat_data07`)
gravam o mesmo campo `shifts[]`. A regra de segurança precisa permitir os dois — é a única
subcoleção com dois donos legítimos.

## Regras de segurança

A regra de `timeOff` da `feat_data03` já contempla os dois:

```
match /businesses/{businessId}/professionals/{professionalId}/timeOff/{timeOffId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == businessId || request.auth.uid == professionalId;
}
```

Falta **substituir** a regra de `professionals` escrita na `feat_data02`, que hoje só permite o
dono do empreendimento (`allow write: if request.auth.uid == businessId`). O profissional precisa
poder atualizar as **próprias** jornadas — e nada além disso:

```
match /businesses/{businessId}/professionals/{professionalId} {
  allow read: if request.auth != null;
  allow create, delete: if request.auth.uid == businessId;
  allow update: if request.auth.uid == businessId
                || (request.auth.uid == professionalId
                    && request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['shifts']));
}
```

> Note que `write` foi **desmembrado** em `create`, `update` e `delete`. `write` cobre os três de
> uma vez, e manter os dois blocos conviveria mal: como as regras são somadas, o `write` antigo
> continuaria concedendo o que este bloco tenta restringir. A regra da `feat_data02` precisa ser
> editada, não complementada.

### O que `hasOnly(['shifts'])` impede

`diff().affectedKeys()` devolve os campos que a escrita **muda**. Restringir a `shifts` bloqueia o
profissional de:

| Tentativa | Campo que mudaria |
|---|---|
| Se auto-reativar depois de inativado pelo salão | `active` |
| Se atribuir serviços que não executa (fura a RN04) | `serviceIds` |
| Se mover para outro empreendimento | o caminho do documento (já barrado) |
| Alterar o próprio nome/telefone no cadastro do salão | `name`, `phone` |

**Sem backend, é a regra do Firestore que sustenta isso** — a validação de front-end não protege
nada (`docs/arquitetura.md`, seção 6). Vale testar essa regra de verdade, tentando a escrita
proibida pelo console.

## Índices

Nenhum. `where('date', '>=', hoje)` com ordenação por `date` usa um único campo — o Firestore
cria índice de campo único automaticamente. Índice composto só seria necessário se a consulta
combinasse `date` com outro filtro.

## Remoção do mock

`mockTimeOff` já sai na `feat_data03`. Aqui fecha a remoção: `mockDb.ts` pode ser **apagado por
completo** — esta é a última feature a depender dele.

## Critério de pronto

- [ ] Alterar a jornada persiste e reflete nos horários livres da `feat_data03`
- [ ] Cadastrar folga zera os horários daquele dia (RN03)
- [ ] Remover folga devolve os horários
- [ ] Não deixa cadastrar folga em data passada
- [ ] Um profissional não consegue alterar a jornada de outro, nem se reativar (testar a regra)
- [ ] `shared/lib/mockDb.ts` apagado e o build segue limpo
