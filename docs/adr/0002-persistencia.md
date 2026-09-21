# ADR 0002 — Persistência: Firebase / Cloud Firestore

**Data:** 2026-09-14
**Status:** Aceito

---

## Contexto

O projeto é um protótipo de aplicação web em React para gestão de agendamentos em salões de
beleza, desenvolvido por uma pessoa como projeto de estudo. Precisamos armazenar profissionais,
serviços, clientes, agendamentos e escalas.

Restrições que pesaram na decisão:

- **Desenvolvedor único e prazo limitado.** Tempo gasto em infraestrutura é tempo não gasto nas
  regras de negócio, que são o objeto do estudo.
- **Necessidade de demonstração.** O protótipo precisa ser mostrado funcionando, idealmente
  acessível de mais de um dispositivo.
- **Sem orçamento.** Solução precisa caber em plano gratuito.

---

## Decisão

Adotamos **Cloud Firestore** (Firebase) como camada de persistência, acessado diretamente pelo
front-end React, sem backend próprio.

---

## Consequências

### Positivas

- Elimina a construção de um backend — sem API REST, sem servidor, sem deploy separado.
  O esforço vai para o domínio.
- Hospedagem resolvida pelo Firebase Hosting, no mesmo ecossistema.
- Dados acessíveis de qualquer dispositivo, o que viabiliza a demonstração.
- Sincronização em tempo real disponível sem custo de implementação — útil numa agenda
  compartilhada, onde duas pessoas podem mexer ao mesmo tempo.
- Plano gratuito folgado para o volume de um protótipo.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| **Banco NoSQL, sem joins.** Não dá para "juntar" agendamento com cliente e serviço numa consulta | Denormalização controlada: o agendamento guarda cópia dos dados que precisa exibir (ver `arquitetura.md`) |
| **Sem integridade referencial.** O banco não impede um agendamento apontar para profissional excluído | Exclusão lógica (`ativo: false`), nunca exclusão física |
| **Regras de negócio não podem morar no banco.** Firestore não tem constraint nem trigger de validação | As regras ficam em módulos de domínio puros, cobertos por teste. Ver ADR 0001 |
| **Dependência de fornecedor e de conexão.** Sem internet, sem app | Aceitável para um protótipo. O acesso ao Firestore fica isolado numa camada de serviços, o que reduz o custo de uma eventual troca |
| **Menos contato com construção de infraestrutura** | Compensado por mais profundidade nas regras de agendamento e nas métricas, que são o foco do projeto |

---

## Alternativas consideradas

### SQLite + API Node/Express

Arquitetura em três camadas clássica. Daria contato com construção de backend e rodaria
totalmente offline, sem conta em serviço externo.

**Rejeitada** porque exigiria construir, testar e hospedar um backend inteiro — esforço que não
avança o objetivo do projeto, que é a gestão de agendamentos e a mensuração de produtividade, não
a construção de infraestrutura.

### IndexedDB local (Dexie)

Zero configuração, o mais rápido para prototipar.

**Rejeitada** porque prende os dados a um único navegador. Um sistema de informação cujo dado não
sobrevive à troca de máquina enfraquece a demonstração e contradiz a proposta de substituir a
agenda de papel por algo confiável.

---

## Revisão

Esta decisão deve ser reavaliada se o projeto passar a exigir operação offline, relatórios com
agregações complexas, ou múltiplos salões com isolamento de dados.
