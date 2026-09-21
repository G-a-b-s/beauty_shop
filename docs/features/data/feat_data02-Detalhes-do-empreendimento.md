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

> **Não confundir com as leituras do dono.** `feat_data06` e `feat_data08` implementam
> `listProfessionalsByBusiness` e `listServicesByBusiness`, que trazem **também os inativos** para
> as telas de gestão. São consultas diferentes sobre a mesma subcoleção, com públicos diferentes.

## Jornadas vêm de graça

`shifts[]` é campo embutido no documento do profissional (`docs/arquitetura.md`), então o read de
profissionais já traz as jornadas — nenhuma leitura extra. É isso que a `feat_data03` aproveita.

## Regras de segurança

Acrescenta a leitura pública das subcoleções:

```
match /businesses/{businessId}/services/{serviceId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == businessId;
}

match /businesses/{businessId}/professionals/{professionalId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == businessId;
}
```

> **Este bloco de `professionals` é provisório.** A [`feat_data12`](feat_data12-Minha-jornada-e-folgas.md)
> vai **substituí-lo**, desmembrando `write` em `create`/`update`/`delete` para o profissional
> poder editar a própria jornada — e só ela. Não dá para complementar depois: como as regras são
> somadas, este `write` continuaria concedendo o que a regra restritiva tenta barrar.

## Índices

Nenhum — consultas de campo único (`active`) dentro de uma subcoleção.

## Remoção do mock

`mockServices` e `mockProfessionals` saem do `mockDb.ts`.

## Critério de pronto

- [ ] Detalhes, serviços e profissionais vêm do Firestore
- [ ] Inativos não aparecem
- [ ] Empreendimento inexistente ou inativo cai no estado "não encontrado"
- [ ] Botão "Agendar" leva ao fluxo da `feat_data03`
