# feat_data02 — Detalhes do empreendimento

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot02`](../prototype/feat_prot02-Detalhes-do-empreendimento.md)
**Depende de:** `feat_data01`
**Fornece:** `getBusinessById`, `listServicesForBusiness`, `listProfessionalsForBusiness` — as
três **reutilizadas** por `feat_data03` e `feat_data07`

---

## Objetivo

Ler um empreendimento e suas subcoleções de serviços e profissionais. É aqui que as leituras
públicas (visão do cliente, só ativos) são implementadas pela primeira vez — as features seguintes
consomem estes mesmos métodos.

## O que muda no código

Só `businesses/services/businessService.ts`:

```ts
export async function getBusinessById(businessId: string): Promise<Business | undefined>
// getDoc(doc(db, 'businesses', businessId))

export async function listServicesForBusiness(businessId: string): Promise<Service[]>
// query(collection(db, 'businesses', businessId, 'services'), where('active', '==', true))

export async function listProfessionalsForBusiness(businessId: string): Promise<Professional[]>
// query(collection(db, 'businesses', businessId, 'professionals'), where('active', '==', true))
```

O filtro de `active` sai do código e vira condição da consulta.

Detalhes da implementação:

- **Mapeamento explícito**, como na `feat_data01`. O `businessId` de serviços e profissionais vem
  do **caminho**, porque os documentos das subcoleções não guardam esse campo
  (`docs/arquitetura.md`). `serviceIds` e `shifts` caem em `[]` se faltarem.
- **Ordenação por nome** no cliente, pelo mesmo motivo da `feat_data01`.
- **Empreendimento inativo ou inexistente vira `undefined`.** Com a regra de leitura abaixo, o
  Firestore responde `permission-denied` em vez de "não existe". O `getBusinessById` trata esse
  código e devolve `undefined`, e a tela mostra "não encontrado". Sem isso, o erro subiria para o
  hook, que não tem `catch`, e a tela ficaria travada em "Carregando…".

> **Não confundir com as leituras do dono.** `feat_data06` e `feat_data08` implementam
> `listProfessionalsByBusiness` e `listServicesByBusiness`, que trazem **também os inativos** para
> as telas de gestão. São consultas diferentes sobre a mesma subcoleção, com públicos diferentes.

## Jornadas vêm de graça

`shifts[]` é campo embutido no documento do profissional (`docs/arquitetura.md`), então o read de
profissionais já traz as jornadas — nenhuma leitura extra. É isso que a `feat_data03` aproveita.

## Regras de segurança

Acrescenta **só a leitura** das subcoleções, porque esta feature só lê:

```
match /businesses/{businessId}/services/{serviceId} {
  allow read: if request.auth != null;
}

match /businesses/{businessId}/professionals/{professionalId} {
  allow read: if request.auth != null;
}
```

A escrita entra nas features que escrevem, já com validação de conteúdo: `professionals` na
[`feat_data06`](feat_data06-Gestao-de-profissionais.md#regras-de-segurança) (edição) e na
[`feat_data07`](feat_data07-Cadastro-edicao-de-profissional.md#regras-de-segurança) (criação),
`services` na [`feat_data08`](feat_data08-Gestao-de-servicos.md#regras-de-segurança), e a jornada
editada pelo próprio profissional na [`feat_data12`](feat_data12-Minha-jornada-e-folgas.md#regras-de-segurança).
Um `write` genérico do dono aqui anularia qualquer validação escrita depois, já que as regras são
somadas.

**Edita** também a leitura de `businesses` da base (`feat_data00`): só o empreendimento ativo é
legível por qualquer conta autenticada; o inativo, só pelo dono.

```
match /businesses/{businessId} {
  allow read: if request.auth != null
              && (resource.data.active == true || request.auth.uid == businessId);
  // create, update e delete continuam como na feat_data00
}
```

A consulta da `feat_data01` segue permitida porque filtra por `active == true`: o Firestore só
aceita uma consulta quando as condições dela garantem a regra. Uma listagem sem filtro passa a ser
negada.

## Índices

Nenhum — consultas de campo único (`active`) dentro de uma subcoleção.

## Remoção do mock

Nada sai do `mockDb.ts` aqui: `mockBusinesses`, `mockServices` e `mockProfessionals` ainda têm
consumidores em features seguintes (`createAppointment`, catálogo de serviços, gestão de
profissionais). Ver o cronograma em [`README.md`](README.md#remoção-do-mock).

## Critério de pronto

- [x] Detalhes, serviços e profissionais vêm do Firestore
- [x] Inativos não aparecem
- [x] Empreendimento inexistente ou inativo cai no estado "não encontrado"
- [x] Botão "Agendar" leva ao fluxo da `feat_data03` — a navegação não mudou; o fluxo em si é
  verificado na `feat_data03`
