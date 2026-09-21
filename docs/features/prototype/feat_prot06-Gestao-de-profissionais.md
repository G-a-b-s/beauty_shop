# feat_prot06 — Gestão de profissionais

**Conta:** Empreendimento
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data06`

---

## Objetivo

Tela principal de gestão de equipe do empreendimento: lista os profissionais cadastrados e dá
acesso ao cadastro de um novo (`feat_prot07`).

## Regra de acesso

Só empreendimento, e só os próprios profissionais (`businessId` da conta logada) — nunca lista
profissional de outro empreendimento (RN09 / isolamento multi-tenant do ADR 0004).

## Elementos de tela

- Lista de profissionais: nome, telefone, quantidade de serviços que executa, status (ativo/
  inativo)
- Botão "Novo profissional" → `feat_prot07`
- Cada item da lista é clicável → `feat_prot07` em modo edição
- Ação de inativar/reativar direto na lista (sem precisar abrir o formulário)

## Dado mockado

Reaproveita `Professional` (de `feat_prot02`), filtrado por um `businessId` fixo simulando o
empreendimento logado.

**Como a conta logada vira um `businessId`:** o hook `useCurrentBusinessId` lê a sessão
(`account.uid` para conta de empreendimento; `account.businessId` para conta de profissional).
Como a autenticação também é mockada no protótipo ([ADR 0009](../../adr/0009-autenticacao-mockada-no-prototipo.md)),
o id da conta **é** o id do empreendimento no mock — não há mapeamento artificial, e o isolamento
entre empreendimentos é real: uma conta nova nasce sem profissional nenhum.

## Interações

- Inativar um profissional (RN08) não o remove da lista — só muda o `active` e o estilo visual
  (esmaecido, com selo "Inativo")
- Lista ordenada por nome

## Fora de escopo (por enquanto)

- Busca/filtro na lista (a lista de um único empreendimento tende a ser pequena)
- Exclusão física de profissional — nunca existe, é exclusão lógica (`docs/arquitetura.md`)
