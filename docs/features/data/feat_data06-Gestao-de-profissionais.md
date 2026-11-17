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

### Ajustes fora de `services/`

- `setProfessionalActive` ganha `businessId` como primeiro argumento: o documento vive em
  `businesses/{businessId}/professionals/{id}` e não há caminho até ele só com o id do
  profissional (mesmo motivo da `feat_data03`). O `useProfessionals` passa a enviá-lo — ele já o
  recebia — e espera o `businessId` chegar antes de ler, para não piscar "Nenhum profissional"
  enquanto a conta carrega.
- O conversor `toProfessional` da `feat_data02` passa a ser exportado por `businessService.ts` e
  reutilizado aqui, em vez de repetir o mapeamento.

A ordenação por nome fica no cliente (`localeCompare` com locale `pt-BR`): o Firestore ordena por
bytes, o que coloca "Ãlvaro" fora de lugar em português.

## Isolamento (RNF04)

O caminho da subcoleção já é escopado por `businessId`, e `businessId` vem do `uid` da sessão —
não existe consulta capaz de alcançar profissional de outro empreendimento. O isolamento é
**estrutural**, não uma cláusula que se pode esquecer (foi essa a razão de escolher subcoleção no
[ADR 0004](../../adr/0004-multi-tenancy-e-autenticacao.md)).

## Regras de segurança

A `feat_data02` só liberou a leitura de `professionals`. Esta feature é a primeira a escrever
(ativar/inativar), então acrescenta a **edição pelo dono**, validando o documento inteiro. A
validação já serve à `feat_data07`, que edita os demais campos, e é reutilizada por ela na criação:

```
function isValidProfessional(data) {
  return data.keys().hasOnly(['name', 'phone', 'serviceIds', 'shifts', 'active'])
    && data.keys().hasAll(['name', 'phone', 'serviceIds', 'shifts', 'active'])
    && data.name is string && data.name.size() > 0
    && data.phone is string
    && data.serviceIds is list && data.serviceIds.size() > 0     // RN11
    && data.shifts is list && data.shifts.size() <= 7
    && data.active is bool;
}

match /businesses/{businessId}/professionals/{professionalId} {
  allow read: if request.auth != null;
  allow update: if request.auth != null && request.auth.uid == businessId
                && isValidProfessional(request.resource.data);
  allow delete: if false;
}
```

A função fica no nível de `match /databases/{database}/documents`, fora dos blocos, para poder ser
usada por mais de um. `delete` é negado porque a exclusão é lógica (`active: false`,
`docs/arquitetura.md`).

O que fica de fora, como risco aceito: a regra não confere se cada id em `serviceIds` é de fato um
serviço do empreendimento (exigiria um `get()` por item, e regras não têm laço). Esse caso fica no
`domain/` (RN04, `feat_data03`).

## Índices

Nenhum — leitura da subcoleção inteira.

## Remoção do mock

Nada a remover aqui: `mockProfessionals` fica até a `feat_data07`, que migra os últimos métodos
que o leem (ver o cronograma em [`README.md`](README.md#remoção-do-mock)).

## Critério de pronto

- [x] Lista traz todos os profissionais do empreendimento logado, ativos e inativos
- [x] Inativar/reativar persiste no Firestore
- [x] Profissional inativado some da tela do cliente (`feat_data02`) e continua na gestão
- [x] Logar com outro empreendimento mostra outra lista (testar com duas contas)
- [x] Só o dono edita, e só com o documento válido; ninguém apaga

Verificado em 16/11/2026: tela via Playwright (Salão Tela com Davi e Elisa; Elisa inativada some
para a Cliente Tela; outra conta de empreendimento vê a própria lista) e script de regras com 10/10
verificações OK (dono ativa/inativa; campo extra, `serviceIds` vazio, `active` inválido e `delete`
recusados; outro empreendimento e cliente recusados).
