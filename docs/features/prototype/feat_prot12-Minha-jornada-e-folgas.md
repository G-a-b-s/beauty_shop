# feat_prot12 — Minha jornada e folgas (profissional)

**Conta:** Profissional
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Relacionado a:** [ADR 0007](../../adr/0007-profissional-como-conta.md) (profissional como conta)
**Integração futura:** `feat_data12`

---

## Objetivo

O profissional ajusta a própria jornada semanal (horário de trabalho por dia da semana) e marca
folgas pontuais.

## Regra de acesso

Só profissional, e só a própria jornada/folga — nunca a de outro profissional.

## Elementos de tela

**Jornada semanal**
- Um horário de início/fim por dia da semana, com opção de marcar o dia como "não trabalhado"
- Valor inicial vem do que o empreendimento cadastrou em `feat_prot07`; aqui o profissional pode
  alterar

**Folgas**
- Lista das folgas futuras cadastradas (data + motivo opcional)
- Botão "Nova folga" — seletor de data + campo de motivo opcional
- Ação de remover uma folga futura

## Dado mockado

Reaproveita `Shift` e `TimeOff` (de `feat_prot03`), filtrados pelo `professionalId` do profissional
logado.

## Interações

- Mudar a jornada ou adicionar folga afeta imediatamente os horários livres calculados em
  `feat_prot03` (mesma função pura de disponibilidade) — importante mockar de forma que os dois
  protótipos leiam do mesmo array em memória, não cópias independentes
- Não deixa cadastrar folga em data passada

## Fora de escopo (por enquanto)

- Folga recorrente (ex.: "toda segunda de manhã") — cada folga é uma data específica
- Aprovação da folga pelo empreendimento (o profissional cadastra e já vale)
