# feat_data08 — Gestão de serviços

**Conta:** Empreendimento
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot08`](../prototype/feat_prot08-Gestao-de-servicos.md)
**Depende de:** `feat_data00` (o `uid` da sessão **é** o `businessId`)
**Fornece:** `listServicesByBusiness` (todos), `createService`, `updateService`, `setServiceActive`

---

## Objetivo

CRUD dos serviços do próprio empreendimento, na visão do dono — que enxerga **também os
inativos**.

## O que muda no código

Só `services-catalog/services/serviceCatalogService.ts`:

| Método | Consulta |
|---|---|
| `listServicesByBusiness` | `collection(db, 'businesses', businessId, 'services')` — sem filtro de `active` |
| `createService` | `addDoc` com `active: true` |
| `updateService` | `updateDoc` de nome, duração e preço |
| `setServiceActive` | `updateDoc` em `{ active }` |

Mesma relação da `feat_data06` com a `feat_data02`: a leitura pública (só ativos) é da
`feat_data02`, esta é a do dono. Consultas diferentes sobre a mesma subcoleção.

## Exclusão lógica

Não existe `deleteDoc`. Serviço inativado some das opções de novo agendamento (RN08), mas
continua referenciado pelos agendamentos históricos — que, de todo modo, guardam cópia do nome e
da duração (`docs/arquitetura.md`). O histórico segue íntegro mesmo se o serviço mudar ou sair.

## Efeito colateral a validar

Inativar um serviço **não** remove o `serviceId` da lista dos profissionais que o executavam. Isso
é intencional: se o serviço for reativado, os profissionais voltam a oferecê-lo sem retrabalho. O
que garante que ele não seja agendado enquanto inativo é o filtro da `feat_data02`.

## Regras de segurança

Já coberto pela regra de `services` da `feat_data02` (`write` só se `uid == businessId`).

## Índices

Nenhum.

## Remoção do mock

Nada a remover aqui: `mockServices` já sai na `feat_data02`.

## Critério de pronto

- [ ] Lista traz todos os serviços do empreendimento logado, ativos e inativos
- [ ] Criar, editar e inativar persistem no Firestore
- [ ] Serviço inativado some da tela do cliente (`feat_data02`) e do fluxo de agendamento
- [ ] Duração aceita só inteiro positivo; preço aceita decimal
