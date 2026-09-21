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

Filtrar `status == 'completed'` também pode subir para a consulta, já que produtividade só conta
atendimento realizado.

### As folgas custam N leituras

Uma consulta por profissional. Com a equipe de um salão pequeno (poucas unidades), é aceitável.
Se crescer, a alternativa é uma consulta `collectionGroup` em `timeOff` filtrada por período —
registrar em novo ADR se virar necessidade.

## Regras de segurança

Nada novo: lê `professionals`, `appointments` e `timeOff` do próprio empreendimento, todas já
cobertas.

## Índices

Composto em `appointments`: `status` + `start` (dentro da subcoleção do empreendimento).

## Remoção do mock

`productivity/services/productivityService.ts` é apagado.

## Critério de pronto

- [ ] Métricas calculadas sobre agendamentos reais do período
- [ ] Trocar o período recalcula
- [ ] Profissional com jornada menor aparece com ocupação proporcionalmente maior — a comparação
      que justifica a métrica (`docs/modelo-dominio.md`, seção 7)
- [ ] Profissional sem jornada cadastrada mostra 0%, sem divisão por zero
- [ ] Folga cadastrada reduz os minutos disponíveis
