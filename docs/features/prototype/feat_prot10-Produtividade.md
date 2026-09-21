# feat_prot10 — Produtividade

**Conta:** Empreendimento
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data10`

---

## Objetivo

Métricas de volume de atendimento e taxa de ocupação por profissional, no período escolhido —
o "diferencial do trabalho".

## Regra de acesso

Só empreendimento, e só sobre os próprios profissionais.

## Elementos de tela

- Seletor de período (ex.: semana atual, mês atual)
- Tabela ou cartões, um por profissional, mostrando:
  - Atendimentos realizados (contagem de `status: 'completed'` no período)
  - Minutos ocupados vs. minutos disponíveis
  - Taxa de ocupação (%)

## Dado mockado

Reaproveita `Appointment` e `Shift` já mockados. Precisa ter agendamentos com `status: 'completed'`
espalhados no período mockado, e profissionais com jornadas de tamanhos diferentes — para a taxa
de ocupação comparar profissionais com carga horária desigual, que é o ponto central dessa métrica
(`docs/modelo-dominio.md`, seção 7).

## Interações

- Trocar o período recalcula as métricas sobre o mock
- Ordenar a lista por taxa de ocupação (maior para menor) por padrão

## Fora de escopo (por enquanto)

- Gráficos — tabela/cartões simples bastam para o protótipo
- Comparação histórica entre períodos
- Exportar relatório
