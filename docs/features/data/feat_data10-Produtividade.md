# feat_data10 — Produtividade

**Conta:** Empreendimento
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot10`](../prototype/feat_prot10-Produtividade.md)
**Depende de:** `feat_data09` (`listAppointmentsForBusiness`), `feat_data06`
(`listProfessionalsByBusiness`) e `feat_data03` (`listTimeOffForProfessional`)
**Fornece:** nada novo — é a feature que **mais reaproveita** e menos cria

---

## Objetivo

Calcular volume de atendimentos e taxa de ocupação por profissional, no período escolhido.

## O que muda no código

**A função de cálculo não muda.** `productivity/domain/metrics.ts` é pura. O que muda é a origem
dos três insumos, todos vindos de métodos que já existem:

| Insumo | Método | Vem de |
|---|---|---|
| Profissionais (com `shifts[]` embutidas) | `listProfessionalsByBusiness` | `feat_data06` |
| Agendamentos do período | `listAppointmentsForBusiness` | `feat_data09` |
| Folgas de cada profissional | `listTimeOffForProfessional` | `feat_data03` |

O arquivo `productivity/services/productivityService.ts`, que no protótipo lia o mock direto,
**deixa de existir**: o hook passa a compor os três métodos acima. Isso é a convenção do pacote
funcionando — nenhuma consulta duplicada.

### Ajuste necessário em `listAppointmentsForBusiness`

A `feat_data09` a criou com recorte de **um dia**. Aqui o recorte é de um **período**. A assinatura
já recebe `dayStart`/`dayEnd`, então basta renomear os parâmetros para `periodStart`/`periodEnd` —
mesma consulta, intervalo maior. Não é método novo.

O filtro `status == 'completed'` também sobe para a consulta, já que produtividade só conta
atendimento realizado: o método ganha um parâmetro opcional de status (mesmo padrão da
`feat_data11`). A `feat_data09` não passa o parâmetro e continua recebendo todos os status. É esse
filtro combinado com a faixa em `start` que exige o índice composto abaixo.

### Como ficou na implementação

- `listAppointmentsForBusiness(businessId, rangeStart, rangeEnd, status?)`: a `feat_data09` já
  tinha criado o método com faixa genérica (período visível da agenda), então só entrou o
  `status` opcional.
- `useProductivity` refaz as três leituras quando o período (7 ou 30 dias) muda, descartando
  respostas atrasadas (`ignore`), e mostra "Não foi possível carregar a produtividade" se alguma
  falhar — sem isso, a falta do índice deixava a tela presa em "Carregando…".
- O domínio (`metrics.ts`) segue filtrando status e período; a consulta só reduz o que é baixado.

### As folgas custam N leituras

Uma consulta por profissional. Com a equipe de um salão pequeno (poucas unidades), é aceitável.
Se crescer, a alternativa é uma consulta `collectionGroup` em `timeOff` filtrada por período —
registrar em novo ADR se virar necessidade.

## Regras de segurança

Nada novo: lê `professionals`, `appointments` e `timeOff` do próprio empreendimento, todas já
cobertas.

## Índices

Composto em `appointments`: `status` ASC + `start` ASC, escopo **coleção** (dentro da subcoleção do
empreendimento). Registrado em `firestore.indexes.json`.

## Remoção do mock

`productivity/services/productivityService.ts` é apagado. `mockAppointments` ainda **fica**: o
`listAppointmentsForProfessional` só migra na `feat_data11`
([ADR 0012](../../adr/0012-projecao-de-horarios-ocupados.md) tirou esse método da `feat_data03`).

`mockTimeOff` fica até a `feat_data12`, que migra `listTimeOff`, `addTimeOff` e `removeTimeOff`.

## Critério de pronto

- [x] Métricas calculadas sobre agendamentos reais do período
- [x] Trocar o período recalcula
- [x] Profissional com jornada menor aparece com ocupação proporcionalmente maior — a comparação
      que justifica a métrica (`docs/modelo-dominio.md`, seção 7)
- [x] Profissional sem jornada cadastrada mostra 0%, sem divisão por zero
- [x] Folga cadastrada reduz os minutos disponíveis

Verificado em 16/11/2026. Tela via Playwright no Salão Tela: Fábio (seg e ter, 09–18) com 1
atendimento realizado de 30 min em 10/11 e folga em 09/11 — 30 dias: 72h disponíveis (9 dias de
9h menos a folga), 0,7%; 7 dias: 18h, 2,8%. Davi, Elisa, Gabi e Hugo, sem jornada, em 0%.
Comparação de jornadas conferida chamando `computeProductivity` no navegador com os mesmos 60 min:
seg–sex 2,2% × só segunda 11,1%; folga numa terça reduz 2700 → 2160 min.
