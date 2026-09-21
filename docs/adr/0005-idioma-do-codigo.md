# ADR 0005 — Idioma do código: inglês

**Data:** 2026-09-18
**Status:** Aceito
**Substitui:** a premissa P6 de `docs/modelo-dominio.md` (seção 8)

---

## Contexto

A premissa original (P6) definia código em português, para manter coerência com a linguagem
ubíqua da documentação. Decisão revista: o código (variáveis, funções, tipos, nomes de arquivo e
pasta, coleções e campos do Firestore) passa a ser escrito em **inglês**, seguindo a convenção
predominante do ecossistema React/TypeScript/Firebase.

**O que não muda:** toda a **documentação** (`docs/`, `README.md`, `METODOLOGIA.md`, ADRs) e todo
**texto visível ao usuário** (labels, mensagens de erro, botões) continuam em português — é a
linguagem ubíqua do domínio e o idioma do público-alvo do sistema.

---

## Decisão

| Termo do domínio (documentação, sempre em português) | Nome em código (inglês) |
|---|---|
| Empreendimento | `Business` |
| Cliente | `Customer` |
| Profissional | `Professional` |
| Serviço | `Service` |
| Agendamento | `Appointment` |
| Jornada | `Shift` |
| Folga | `TimeOff` |
| Escala | `Schedule` |
| Disponibilidade | `Availability` |

**Exceção:** `cpf` e `cnpj` continuam com esse nome em código — são identificadores legais
brasileiros sem equivalente em inglês (equivalente a manter `IBAN` ou `VAT` em código
internacional).

---

## Consequências

### Positivas

- Alinha o projeto com a convenção quase universal de bibliotecas, exemplos e documentação do
  ecossistema JS/TS/Firebase, o que facilita comparar com material de referência externo.
- Nomes de coleção/campo do Firestore em inglês evitam problemas de acentuação em nomes de
  caminho e ficam mais previsíveis em regras de segurança escritas com base em documentação
  oficial (majoritariamente em inglês).

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| Documentação e código passam a usar dois idiomas diferentes para o mesmo termo | Tabela de tradução acima, mantida como referência única |
| Dados já gravados no Firestore durante os testes (campos `nome`, `telefone`, coleções `clientes`/`empreendimentos`) ficam com nomes divergentes do novo código | Aceitável: são dados de teste, apagados manualmente; não há dado de produção a migrar |

---

## Alternativas consideradas

**Manter código em português (P6 original).** Rejeitada porque o autor decidiu priorizar
consistência com o ecossistema técnico de referência sobre a coerência total com a linguagem
ubíqua — troca consciente de prioridade, não invalida o raciocínio original do P6, só o substitui.
