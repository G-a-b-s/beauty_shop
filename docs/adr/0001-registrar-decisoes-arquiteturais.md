# ADR 0001 — Registrar decisões arquiteturais

**Data:** 2026-09-14
**Status:** Aceito

---

## Contexto

O projeto será desenvolvido de forma intermitente, em paralelo com outras atividades. Decisões
técnicas tomadas hoje serão questionadas depois — pelo próprio autor, daqui a alguns meses, sem
lembrar por que escolheu aquilo.

Sem registro, o que sobra é o resultado da decisão (o código) mas não o **raciocínio** que levou
a ela. Num projeto de estudo, o raciocínio é justamente a parte que interessa preservar — e é a
primeira que se perde.

---

## Decisão

Toda decisão arquiteturalmente significativa será registrada como um **ADR** — documento curto,
numerado e imutável, em `docs/adr/`.

**Formato:** Contexto → Decisão → Consequências → Alternativas consideradas.

**Quando criar um ADR:**

- Adicionar dependência externa relevante (banco, biblioteca estruturante, serviço)
- Escolher ou trocar tecnologia de base
- Tomar decisão cara de reverter
- Definir ou alterar uma premissa de escopo

**Quando *não* criar:** mudanças de implementação, refatorações, escolha de nome, adição de
componente ou função. Estas vivem no código.

**Imutabilidade:** um ADR aceito não é editado. Se a decisão mudar, cria-se um novo ADR que
substitui o anterior, e o antigo passa a `Status: Substituído por ADR NNNN`. O histórico precisa
ser um retrato fiel do que foi decidido naquele momento.

---

## Consequências

### Positivas

- Fica registrado o porquê de cada escolha, junto com as alternativas que foram descartadas.
- Retomar o projeto depois de uma pausa fica barato: a pasta `adr/` conta a história.
- Força a explicitar o trade-off no momento da escolha, quando o contexto ainda está fresco.

### Negativas

- Custo de escrita a cada decisão relevante. Mitigado pelo critério acima: ADR é para o que é
  estruturante, não para tudo.
- Risco de a documentação envelhecer em relação ao código. Mitigado pela imutabilidade — o ADR
  não descreve o sistema atual, descreve uma decisão datada.

---

## Alternativas consideradas

**Não documentar decisões.** Descartada: joga fora o principal aprendizado do projeto — o
raciocínio por trás das escolhas, que é mais durável que o código em si.

**Documentar tudo num único documento de arquitetura.** Descartada: vira um texto grande que
ninguém atualiza, e perde a data e o contexto de cada escolha individual.

**Wiki ou ferramenta externa.** Descartada: separa a documentação do código. Em `docs/adr/` a
decisão versiona junto com o que ela afeta.

---

## Referência

NYGARD, M. *Documenting Architecture Decisions*, 2011.
