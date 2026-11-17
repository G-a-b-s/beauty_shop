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

### Ajustes fora de `services/`

- `updateService` e `setServiceActive` ganham `businessId` como primeiro argumento (o documento
  vive em `businesses/{businessId}/services`). O `useServiceCatalog` já o tinha e passa a enviá-lo;
  também espera o id chegar antes de ler.
- O conversor `toService` da `feat_data02` passa a ser exportado por `businessService.ts` e
  reutilizado aqui (mesmo caso do `toProfessional` na `feat_data06`).
- O formulário mostra o erro quando salvar falha e é remontado (`key`) ao trocar de serviço em
  edição — antes, clicar em outro serviço com o formulário aberto mantinha os campos do anterior.

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

A `feat_data02` só liberou a leitura de `services`. Esta feature acrescenta a escrita pelo dono,
validando o conteúdo — inclusive a RN10, porque a regra de agendamento da `feat_data03` confia em
`durationMinutes` para conferir o `end`:

```
function isValidService(data) {
  return data.keys().hasOnly(['name', 'durationMinutes', 'price', 'active'])
    && data.keys().hasAll(['name', 'durationMinutes', 'price', 'active'])
    && data.name is string && data.name.size() > 0
    && data.durationMinutes is int && data.durationMinutes > 0   // RN10
    && data.price is number && data.price >= 0
    && data.active is bool;
}

match /businesses/{businessId}/services/{serviceId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == businessId
                && isValidService(request.resource.data)
                && request.resource.data.active == true;
  allow update: if request.auth != null && request.auth.uid == businessId
                && isValidService(request.resource.data);
  allow delete: if false;
}
```

`durationMinutes is int` também barra duração fracionária: o SDK grava número inteiro do
JavaScript como inteiro do Firestore. `delete` é negado porque a exclusão é lógica
(`active: false`).

## Índices

Nenhum.

## Remoção do mock

`mockServices` sai do `mockDb.ts`: o `serviceCatalogService` era o último consumidor. O tipo
`Service` passa para `shared/types/service.ts`, porque é usado por várias features.

## Critério de pronto

- [x] Lista traz todos os serviços do empreendimento logado, ativos e inativos
- [x] Criar, editar e inativar persistem no Firestore
- [x] Serviço inativado some da tela do cliente (`feat_data02`) e do fluxo de agendamento
- [x] Duração aceita só inteiro positivo; preço aceita decimal

Verificado em 16/11/2026: tela via Playwright no Salão Tela (Barba criada com R$ 45,90, editada
para 25 min e R$ 39,50, inativada; a Cliente Tela vê só o Corte nos detalhes e no agendamento) e
script de regras com 14/14 verificações OK (duração fracionária/zero, preço negativo, nome vazio,
criar inativo, campo extra e `delete` recusados; preço decimal aceito; outro empreendimento e
cliente recusados).
