# feat_prot07 — Cadastro/edição de profissional

**Conta:** Empreendimento
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Depende de:** `feat_prot06`
**Relacionado a:** [ADR 0007](../../adr/0007-profissional-como-conta.md) (profissional como conta)
**Integração futura:** `feat_data07`

---

## Objetivo

Formulário de cadastro (ou edição) de um profissional pelo empreendimento: dados pessoais, quais
serviços executa, jornada semanal inicial, e a credencial de acesso do profissional.

## Regra de acesso

Só empreendimento, sobre profissionais do próprio `businessId`.

## Elementos de tela

**Dados pessoais**
- Nome
- Telefone

**Acesso** (só no cadastro — não editável depois, ver "Fora de escopo")
- E-mail de login do profissional
- Senha inicial

**Serviços que executa**
- Lista de checkboxes com os serviços ativos do empreendimento (`feat_prot08`) — RN04 depende
  disso estar certo

**Jornada semanal inicial**
- Um horário de início/fim por dia da semana marcado como trabalhado (mesmo formato de `Shift`
  usado em `feat_prot03`)
- **Nota:** essa jornada pode ser ajustada depois pelo próprio profissional em `feat_prot12` —
  aqui é só o valor inicial

## Dado mockado

Reaproveita `Professional` e `Shift` já mockados em `feat_prot02`/`feat_prot03`. O cadastro novo
gera um `Professional` com `active: true` por padrão.

## Interações

- Salvar com serviços vazios não é permitido (profissional sem serviço não aparece pra nenhum
  cliente agendar — regra de UX, não uma RN numerada)
- Editar um profissional existente não mostra os campos de "Acesso" (e-mail/senha) — variação de
  layout só entre "novo" e "edição"

## Credencial de acesso

O cadastro registra a credencial do profissional na autenticação mockada
([ADR 0009](../../adr/0009-autenticacao-mockada-no-prototipo.md)): depois de salvo, ele consegue
**logar de verdade** com o e-mail/senha informados e cair no próprio fluxo (`feat_prot11` e
`feat_prot12`). Isso torna o ciclo do [ADR 0007](../../adr/0007-profissional-como-conta.md)
testável ponta a ponta já no protótipo.

## Fora de escopo (por enquanto)

- Trocar e-mail/senha do profissional depois de criado — no protótipo, o campo nem aparece na
  edição; a implementação real desse fluxo (segunda instância do Firebase App) é detalhe do
  `feat_data07`, conforme ADR 0007
- Reenviar credencial por e-mail
