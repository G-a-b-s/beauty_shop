# feat_data12 — Minha jornada e folgas (profissional)

**Conta:** Profissional
**Pacote:** Integração de dados — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Substitui o mock de:** [`feat_prot12`](../prototype/feat_prot12-Minha-jornada-e-folgas.md)
**Depende de:** `feat_data03` (`listTimeOffForProfessional`) e `feat_data07`
(`updateProfessionalShifts`, `getProfessionalById`)
**Fornece:** `addTimeOff`, `removeTimeOff`

---

## Objetivo

Permitir que o profissional altere a própria jornada semanal e cadastre folgas. Última feature do
pacote — e a que fecha o ciclo: o que ele muda aqui reflete imediatamente nos horários livres que o
cliente vê na `feat_data03`.

## O que muda no código

Só `professionals/services/professionalService.ts`:

| Método | Consulta | Origem |
|---|---|---|
| `getProfessionalById` | `getDoc` no documento do profissional (traz `shifts[]` embutidas) | `feat_data07` |
| `updateProfessionalShifts` | `updateDoc` em `{ shifts }` | `feat_data07` |
| `listTimeOff` | subcoleção `timeOff` | `feat_data03` (`listTimeOffForProfessional`) |
| `addTimeOff` | `addDoc` na subcoleção | **novo aqui** |
| `removeTimeOff` | `deleteDoc` na subcoleção | **novo aqui** |

Dos cinco métodos, **três já existem**. Só as duas escritas de folga são novas.

### Como ficou na implementação

- `listTimeOff` (do mock) **sai** do `professionalService`: o `useMySchedule` passa a usar o
  `listTimeOffForProfessional` da `feat_data03` direto, em vez de repetir a consulta.
- `addTimeOff(businessId, professionalId, date, reason)` e
  `removeTimeOff(businessId, professionalId, timeOffId)` ganham `businessId` e `professionalId`
  (a folga vive em `businesses/{b}/professionals/{p}/timeOff`). `reason` vazio não é gravado.
- O `useMySchedule` mostra erro quando uma escrita falha e, na jornada (que salva a cada mudança
  do editor), volta para a jornada anterior se a gravação for recusada.
- A RN12 continua na tela (`min` do campo de data e botão desabilitado para data passada).

## Folga é a exceção da exclusão lógica

Todo o resto do sistema usa exclusão lógica (`active: false`), porque há histórico apontando. Folga
não: ela não é referenciada por nada, e uma folga removida não precisa deixar rastro. `deleteDoc`
é o certo aqui.

## Quem pode escrever

Tanto o profissional (própria jornada) quanto o empreendimento (jornada inicial, na `feat_data07`)
gravam o mesmo campo `shifts[]`. A regra de segurança precisa permitir os dois — é a única
subcoleção com dois donos legítimos.

## Regras de segurança

A `feat_data03` só liberou a leitura de `timeOff`. Esta feature acrescenta a escrita, já
desmembrada — sem `write` genérico. Folga não é editada (cria-se outra), e é a exceção da exclusão
lógica, então há `delete`:

```
match /businesses/{businessId}/professionals/{professionalId}/timeOff/{timeOffId} {
  // ... read da feat_data03

  function canManage() {
    return request.auth != null
      && (request.auth.uid == businessId || request.auth.uid == professionalId);
  }

  allow create: if canManage()
                && request.resource.data.keys().hasAll(['date'])
                && request.resource.data.keys().hasOnly(['date', 'reason'])
                && request.resource.data.date is string
                && request.resource.data.date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
                && (!('reason' in request.resource.data)
                    || (request.resource.data.reason is string
                        && request.resource.data.reason.size() <= 200));
  allow update: if false;
  allow delete: if canManage();
}
```

A RN12 (folga não pode estar no passado) fica no `domain/`: a data é uma string no fuso local, e a
regra não compara isso de forma confiável com `request.time` — mesmo motivo da RN02/RN05 na
`feat_data03`.

Falta o profissional poder atualizar as **próprias** jornadas — e nada além disso. As regras de
`professionals` das `feat_data06` e `feat_data07` só liberam o dono do empreendimento, já
desmembradas em `create`/`update`/`delete`. Por isso basta **acrescentar** um `update` para o
profissional; nada precisa ser editado:

```
match /businesses/{businessId}/professionals/{professionalId} {
  // read, create, update do dono e delete como nas feat_data06 e feat_data07
  allow update: if request.auth != null && request.auth.uid == professionalId
                && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['shifts'])
                && request.resource.data.shifts is list
                && request.resource.data.shifts.size() <= 7;
}
```

> Isso só funciona porque nenhuma regra anterior usou `write` genérico em `professionals`. Como as
> regras são somadas, um `write` do dono continuaria valendo ao lado deste `update` — o que é
> inofensivo aqui, mas um `write` amplo (por exemplo, para qualquer autenticado) anularia a
> restrição. Por isso a `feat_data02` só acrescentou leitura.

### O que `hasOnly(['shifts'])` impede

`diff().affectedKeys()` devolve os campos que a escrita **muda**. Restringir a `shifts` bloqueia o
profissional de:

| Tentativa | Campo que mudaria |
|---|---|
| Se auto-reativar depois de inativado pelo salão | `active` |
| Se atribuir serviços que não executa (fura a RN04) | `serviceIds` |
| Se mover para outro empreendimento | o caminho do documento (já barrado) |
| Alterar o próprio nome/telefone no cadastro do salão | `name`, `phone` |

**Sem backend, é a regra do Firestore que sustenta isso** — a validação de front-end não protege
nada (`docs/arquitetura.md`, seção 6). Vale testar essa regra de verdade, tentando a escrita
proibida pelo console.

## Índices

Nenhum. `where('date', '>=', hoje)` com ordenação por `date` usa um único campo — o Firestore
cria índice de campo único automaticamente. Índice composto só seria necessário se a consulta
combinasse `date` com outro filtro.

## Remoção do mock

`mockTimeOff` sai aqui: `listTimeOff`, `addTimeOff` e `removeTimeOff` eram os últimos
consumidores. O tipo `TimeOff` passa para `shared/types/timeOff.ts`. Com isso, `mockDb.ts` fica vazio e é
**apagado por completo** — esta é a última feature a depender dele.

## Critério de pronto

- [x] Alterar a jornada persiste e reflete nos horários livres da `feat_data03`
- [x] Cadastrar folga zera os horários daquele dia (RN03)
- [x] Remover folga devolve os horários
- [x] Não deixa cadastrar folga em data passada
- [x] Um profissional não consegue alterar a jornada de outro, nem se reativar (testar a regra)
- [x] `shared/lib/mockDb.ts` apagado e o build segue limpo

Verificado em 16/11/2026. Tela via Playwright: Fábio adicionou a quarta e o calendário da Cliente
Tela passou a liberar 18/11 e 25/11; folga em 24/11 apagou o dia e removê-la devolveu os 18
horários; data passada (10/11) deixa o botão desabilitado. Script de regras com 18/18 verificações
OK (profissional só altera `shifts` e com até 7 itens; folga só com `date` YYYY-MM-DD, `reason` até
200 e sem update; colega e cliente recusados; dono do salão cria e apaga folga). Build, lint e
testes limpos sem o `mockDb.ts`.
