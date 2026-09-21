# feat_prot04 — Meus agendamentos

**Conta:** Cliente
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data04`

---

## Objetivo

Lista os agendamentos do cliente logado — futuros e passados — e permite cancelar um agendamento
futuro.

## Regra de acesso

Só cliente. Mostra apenas agendamentos cujo `customerId` é o da conta logada.

## Elementos de tela

- Duas seções (ou abas): **Próximos** e **Histórico**
- Cada item mostra: nome do empreendimento, nome do serviço, nome do profissional, data/hora,
  status
- Item de "Próximos" tem botão "Cancelar"
- Item de "Histórico" (status `completed`, `cancelled` ou `noShow`) não tem ação

## Dado mockado

Reaproveita o mock de `Appointment` do `feat_prot03`. Como o `uid` do cliente logado só é
conhecido em tempo de execução (a autenticação já é real desde a Etapa 2), o mock **semeia**
agendamentos para o `customerId` da conta logada na primeira leitura — um de cada status
(`scheduled`, `completed`, `cancelled`, `noShow`), para as duas seções da tela terem conteúdo.

Os nomes exibidos (empreendimento, serviço, profissional) vêm dos campos denormalizados do próprio
agendamento (ver `feat_prot03`), não de uma busca extra — mesmo comportamento que a `feat_data04`
terá com o Firestore.

## Interações

- "Próximos" = agendamentos com `status: 'scheduled'` e `start` no futuro
- "Histórico" = todo o resto
- Cancelar muda o `status` do agendamento mockado para `'cancelled'` na lista em memória e move o
  item de "Próximos" para "Histórico" — sem confirmação extra de diálogo (manter simples)
- RN07 (cancelado libera o horário) só passa a valer de verdade no `feat_data03`, quando o
  cálculo de disponibilidade ler agendamento real; aqui só o `status` muda visualmente

## Fora de escopo (por enquanto)

- Reagendar (cancelar + criar novo é o fluxo por enquanto)
- Avaliar o atendimento após `completed`
