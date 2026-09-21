# feat_prot11 — Minha agenda (profissional)

**Conta:** Profissional
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Relacionado a:** [ADR 0007](../../adr/0007-profissional-como-conta.md) (profissional como conta)
**Integração futura:** `feat_data11`

---

## Objetivo

Primeira tela que o profissional vê após login: seus próprios agendamentos, em três visões —
dia, semana e mês.

## Regra de acesso

Só profissional, e só os próprios agendamentos (`professionalId` da conta logada). Um
profissional **nunca** vê agendamento de outro profissional, mesmo do mesmo empreendimento.

## Elementos de tela

- Alternador de visão: **Dia** / **Semana** / **Mês**
- **Dia:** lista de horários do dia, com cliente e serviço em cada agendamento
- **Semana:** grade de 7 colunas (uma por dia), cada uma com os agendamentos daquele dia
- **Mês:** calendário mensal, com indicador de quantos agendamentos existem em cada dia (o clique
  num dia leva à visão Dia daquela data)
- Navegação para período anterior/seguinte em qualquer uma das três visões

## Dado mockado

Reaproveita `Appointment`, filtrado por um `professionalId` fixo simulando o profissional logado.
Mockar agendamentos espalhados em pelo menos 3 semanas diferentes, para a visão de mês ter mais de
uma semana com dado.

## Interações

- Somente leitura — o profissional não marca resultado do atendimento aqui (isso é
  responsabilidade do empreendimento em `feat_prot09`, pelo menos por ora)
- Nenhuma ação de cancelar/editar agendamento nesta tela

## Fora de escopo (por enquanto)

- Profissional marcar o próprio atendimento como realizado/falta — decidir depois se essa
  responsabilidade deveria ser dele também, ou só do empreendimento (`feat_prot09`)
- Bloquear horário avulso fora da jornada (isso é folga, tratado em `feat_prot12`)
