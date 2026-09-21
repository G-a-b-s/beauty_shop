# feat_prot08 — Gestão de serviços

**Conta:** Empreendimento
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data08`

---

## Objetivo

Lista, cadastra, edita e inativa os serviços oferecidos pelo empreendimento.

## Regra de acesso

Só empreendimento, e só os próprios serviços (`businessId` da conta logada).

## Elementos de tela

- Lista de serviços: nome, duração (minutos), preço, status (ativo/inativo)
- Botão "Novo serviço" → formulário (nome, duração em minutos, preço)
- Cada item clicável → formulário em modo edição
- Ação de inativar/reativar direto na lista

## Dado mockado

Reaproveita `Service` (de `feat_prot02`), filtrado pelo `businessId` fixo simulando o
empreendimento logado.

## Interações

- Duração deve ser um número inteiro positivo (minutos)
- Preço aceita casas decimais
- Inativar um serviço (RN08) não o remove — profissionais que o executavam continuam com a
  referência, mas ele some das opções de novo agendamento (`feat_prot03`)

## Fora de escopo (por enquanto)

- Categorias de serviço
- Duração variável por profissional (Q2 em aberto no modelo de domínio)
