# feat_data01 — Listagem de empreendimentos

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot01`](../prototype/feat_prot01-Listagem-de-empreendimentos.md)
**Depende de:** `feat_data00` (sessão autenticada)
**Fornece:** `listBusinesses`

---

## Objetivo

Trocar o array mockado de empreendimentos por uma leitura real da coleção `businesses`.

## O que muda no código

Só `businesses/services/businessService.ts`:

```ts
export async function listBusinesses(): Promise<Business[]> {
  const snapshot = await getDocs(query(collection(db, 'businesses'), where('active', '==', true)))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Business)
}
```

O filtro de `active` sai do hook e vira condição da consulta — o cliente nunca baixa
empreendimento inativo.

## A busca continua no cliente

O campo de busca (nome/cidade, sem acento) permanece **filtrando em memória**, no hook, como no
protótipo. Motivo: o Firestore não faz busca parcial nem insensível a acento sem um serviço de
indexação externo (Algolia/Typesense), o que está fora do escopo (ADR 0002 — sem infraestrutura
adicional). Com o volume de um protótipo, baixar a lista e filtrar no cliente é adequado.

**Consequência assumida:** se a plataforma crescer para centenas de empreendimentos, a busca
precisa virar consulta paginada por cidade + serviço de busca textual. Registrar em novo ADR
quando/se isso acontecer.

## Regras de segurança

Já coberto pela base da `feat_data00` (`businesses` legível por autenticado).

## Índices

Nenhum — consulta de campo único (`active`) usa índice automático.

## Remoção do mock

`mockBusinesses` sai do `mockDb.ts`.

## Critério de pronto

- [ ] A lista mostra empreendimentos vindos do Firestore
- [ ] Empreendimento inativo não aparece
- [ ] Busca por nome e por cidade segue funcionando, sem acento
- [ ] Estado vazio aparece quando a busca não encontra nada
