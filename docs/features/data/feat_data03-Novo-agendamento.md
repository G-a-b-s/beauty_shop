# feat_data03 — Novo agendamento

**Conta:** Cliente
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot03`](../prototype/feat_prot03-Novo-agendamento.md)
**Depende de:** `feat_data02` (reutiliza `listServicesForBusiness` e `listProfessionalsForBusiness`)
**Fornece:** conversores de `Timestamp` em `shared/lib/firestore.ts`, `listShiftsForProfessional`,
`listTimeOffForProfessional`, `listAppointmentsForProfessional`, `createAppointment`

---

## Objetivo

Ligar o cálculo de disponibilidade e a criação do agendamento ao Firestore. A feature mais
sensível do pacote: é ela que introduz **escrita** e o tratamento de data/hora.

## O que muda no código

**A função de disponibilidade não muda.** `appointments/domain/availability.ts` é pura e recebe
valores — ela não sabe se vieram de mock ou do Firestore. Todo o esforço fica no `service`.

### Novo: conversores de data (`shared/lib/firestore.ts`)

O Firestore guarda data como `Timestamp`, o domínio trabalha com `Date`. Um par de conversores
usado por toda feature que lê ou grava agendamento:

```ts
export function toDate(value: Timestamp): Date
export function toTimestamp(value: Date): Timestamp
```

Consumido depois por `feat_data04`, `09`, `10` e `11` — **não reimplementar**.

### `appointments/services/appointmentService.ts`

| Método | Consulta |
|---|---|
| `listShiftsForProfessional` | lê `shifts[]` do documento do profissional (sem leitura extra) |
| `listTimeOffForProfessional` | `businesses/{businessId}/professionals/{uid}/timeOff` |
| `listAppointmentsForProfessional` | `appointments` do empreendimento, `where professionalId ==`, `where status == 'scheduled'` |
| `createAppointment` | `addDoc` em `businesses/{businessId}/appointments` |

A consulta de agendamentos passa a filtrar `status == 'scheduled'` **no servidor** — só o que
bloqueia horário (RN07) trafega.

### Denormalização na escrita

`createAppointment` grava a cópia histórica de `businessName`, `professionalName`, `customerName`,
`serviceName` e `durationMinutes`, conforme `docs/arquitetura.md`. Os nomes já estão em memória
(vieram da `feat_data02` e da sessão), então **não há leitura extra** para montá-los.

## Regras de negócio

RN01 a RN09 continuam no `domain/`, validadas no cliente. Sem backend, isso é consistência de
fluxo, não segurança (`docs/arquitetura.md`, seção 6) — a regra do Firestore não consegue verificar
sobreposição de horário. **Risco conhecido e aceito no escopo do protótipo.**

Esta é a feature indicada para o **TDD pontual** previsto no `METODOLOGIA.md`: `availability.ts` é
função pura com muitos casos de borda.

## Regras de segurança

```
match /businesses/{businessId}/appointments/{appointmentId} {
  allow read: if request.auth.uid == businessId
              || request.auth.uid == resource.data.customerId
              || request.auth.uid == resource.data.professionalId;
  allow create: if request.auth.uid == request.resource.data.customerId;
  allow update: if request.auth.uid == businessId
                || request.auth.uid == resource.data.customerId;
  allow delete: if false;
}

match /businesses/{businessId}/professionals/{professionalId}/timeOff/{timeOffId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == businessId || request.auth.uid == professionalId;
}
```

## Índices

Composto em `appointments`: `professionalId` + `status` + `start`.

## Remoção do mock

`mockAppointments`, `mockTimeOff` e as funções de seed saem do `mockDb.ts`.

## Critério de pronto

- [ ] Horários livres calculados sobre jornada, folga e agendamentos reais
- [ ] Confirmar grava o agendamento no Firestore e navega para "Meus agendamentos"
- [ ] O horário recém-agendado some da lista de livres
- [ ] RN01 coberta por teste automatizado
