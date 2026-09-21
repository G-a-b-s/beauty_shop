# feat_data06 — Gestão de profissionais

**Conta:** Empreendimento
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot06`](../prototype/feat_prot06-Gestao-de-profissionais.md)
**Depende de:** `feat_data00` (o `uid` da sessão **é** o `businessId`)
**Fornece:** `listProfessionalsByBusiness` (todos, inclusive inativos) e `setProfessionalActive` —
reutilizados por `feat_data07` e `feat_data10`

---

## Objetivo

Listar os profissionais do próprio empreendimento, na visão do dono — que, diferente do cliente,
enxerga **também os inativos**.

## O que muda no código

Só `professionals/services/professionalService.ts`:

| Método | Consulta |
|---|---|
| `listProfessionalsByBusiness` | `collection(db, 'businesses', businessId, 'professionals')` — sem filtro de `active` |
| `setProfessionalActive` | `updateDoc` em `{ active }` |

> **Por que não reaproveita `listProfessionalsForBusiness` da `feat_data02`.** Aquela filtra
> `active == true` na consulta, porque é a visão pública do cliente. Aqui o dono precisa ver o
> inativo para poder reativá-lo. Mesma subcoleção, consultas diferentes, públicos diferentes —
> não é duplicação.

A ordenação por nome fica no cliente (`localeCompare` com locale `pt-BR`): o Firestore ordena por
bytes, o que coloca "Ãlvaro" fora de lugar em português.

## Isolamento (RN09)

O caminho da subcoleção já é escopado por `businessId`, e `businessId` vem do `uid` da sessão —
não existe consulta capaz de alcançar profissional de outro empreendimento. O isolamento é
**estrutural**, não uma cláusula que se pode esquecer (foi essa a razão de escolher subcoleção no
[ADR 0004](../../adr/0004-multi-tenancy-e-autenticacao.md)).

## Regras de segurança

Já coberto pela regra de `professionals` da `feat_data02` (`write` só se `uid == businessId`).

## Índices

Nenhum — leitura da subcoleção inteira.

## Remoção do mock

Nada a remover aqui: `mockProfessionals` já sai na `feat_data02`.

## Critério de pronto

- [ ] Lista traz todos os profissionais do empreendimento logado, ativos e inativos
- [ ] Inativar/reativar persiste no Firestore
- [ ] Profissional inativado some da tela do cliente (`feat_data02`) e continua na gestão
- [ ] Logar com outro empreendimento mostra outra lista (testar com duas contas)
