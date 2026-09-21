# feat_prot09 — Agenda do empreendimento

**Conta:** Empreendimento
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data09`

---

## Objetivo

Visão consolidada de todos os agendamentos do empreendimento (todos os profissionais juntos),
por dia, com ação de marcar o resultado do atendimento.

## Regra de acesso

Só empreendimento, e só agendamentos do próprio `businessId`.

## Elementos de tela

- Seletor de data (padrão: hoje)
- Lista de agendamentos do dia, agrupados por profissional ou ordenados por horário — mostrando:
  horário, cliente, serviço, profissional, status
- Ação por item: marcar como **Realizado**, **Falta** ou **Cancelado** (só disponível enquanto
  `status: 'scheduled'`)

## Dado mockado

Reaproveita `Appointment` (de `feat_prot03`), filtrado por `businessId`. Mockar agendamentos em
pelo menos 2 profissionais diferentes no mesmo dia, para a visão "todos juntos" fazer sentido.

## Interações

- Trocar a data recarrega a lista (filtra o mock por `start` dentro do dia escolhido)
- Marcar como Realizado/Falta/Cancelado muda o `status` do agendamento mockado (RN07: cancelado
  ou falta libera o horário — visual apenas aqui, valendo de verdade em `feat_data03`)

## Fora de escopo (por enquanto)

- Visão de semana/mês (a agenda do empreendimento é por dia; visão de período mais longo é do
  profissional individual, `feat_prot11`)
- Criar agendamento diretamente por aqui (fluxo de criação é só pelo cliente, `feat_prot03`)
