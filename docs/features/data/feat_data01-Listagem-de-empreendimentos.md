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
function toBusiness(snapshot: QueryDocumentSnapshot): Business {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    name: data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    active: data.active,
  }
}

export async function listBusinesses(): Promise<Business[]> {
  const snapshot = await getDocs(query(collection(db, 'businesses'), where('active', '==', true)))
  return snapshot.docs.map(toBusiness).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}
```

O filtro de `active` vira condição da consulta — o cliente nunca baixa empreendimento inativo. O
hook continua filtrando também, o que fica redundante, mas é inofensivo e mantém o hook intocado.

**Mapeamento explícito.** Os campos são copiados um a um, em vez de `...doc.data()`. Com o
espalhamento, o objeto carregaria o `cnpj` e qualquer campo extra do documento, fingindo ser um
`Business`.

**Ordenação no cliente, por nome.** Sem ordenação, o Firestore devolve na ordem do id do documento
(o `uid`, aleatório). Um `orderBy('name')` junto com o `where('active')` exigiria índice composto;
para uma lista que já é baixada inteira, ordenar em memória é suficiente.

**Transição.** Até a `feat_data02`, a tela de detalhes ainda lê o mock: clicar num empreendimento
real da lista leva a "não encontrado".

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

Nenhuma ainda. `mockBusinesses` continua no `mockDb.ts` porque ainda tem dois consumidores:
`getBusinessById` (migra na `feat_data02`) e `createAppointment`, que lê dali o `businessName`
(migra na `feat_data03`). Ele sai na `feat_data03`, junto com o último consumidor.

O tipo `Business` também continua reexportado do `mockDb.ts`, como os tipos das demais features.
Movê-lo para `businesses/types.ts` agora faria o `mockDb.ts` (em `shared/`) importar de uma feature,
invertendo a dependência.

## Riscos conhecidos

Se a consulta falhar (rede, regra), o `useBusinesses` não trata o erro e a tela fica em
"Carregando…". Vale para quase todos os hooks, porque o mock nunca falhava; fica para uma decisão
única sobre tratamento de erro nos hooks, e não para uma exceção pontual aqui.

## Critério de pronto

- [x] A lista mostra empreendimentos vindos do Firestore
- [x] Empreendimento inativo não aparece
- [x] Busca por nome e por cidade segue funcionando, sem acento
- [x] Estado vazio aparece quando a busca não encontra nada
