# ADR 0008 — React Router para navegação entre telas

**Data:** 2026-09-18
**Status:** Aceito
**Complementa:** [ADR 0003](0003-stack-front-end.md) (stack do front-end)

---

## Contexto

O ADR 0003 decidiu Vite/SPA e hooks próprios, mas não tratou de navegação entre telas — na época
só existia a tela de autenticação. Com as 12 telas documentadas em `docs/features/prototype/`,
divididas em três fluxos por tipo de conta (cliente, empreendimento, profissional — ADR 0004 e
0007), o app precisa de um mecanismo real de rotas: lista → detalhes → agendamento, por exemplo.

---

## Decisão

Adotamos **React Router** (`react-router-dom`) para navegação com URL.

### Estrutura de rotas por tipo de conta

```
/                          → decide para onde ir com base em account.type
/login                     → AuthScreen (login/cadastro), só se deslogado

/businesses                → feat_prot01 (cliente)
/businesses/:businessId    → feat_prot02 (cliente)
/businesses/:businessId/book → feat_prot03 (cliente)
/appointments              → feat_prot04 (cliente)
/profile                   → feat_prot05 (cliente)

/professionals             → feat_prot06 (empreendimento)
/professionals/new         → feat_prot07 (empreendimento)
/professionals/:id/edit    → feat_prot07 (empreendimento)
/services                  → feat_prot08 (empreendimento)
/schedule                  → feat_prot09 (empreendimento)
/productivity              → feat_prot10 (empreendimento)

/my-schedule               → feat_prot11 (profissional)
/my-shift                  → feat_prot12 (profissional)
```

Um cliente que tentar acessar `/professionals` (ou qualquer rota de outro tipo de conta) é
redirecionado para a home do próprio tipo — reforça na navegação a mesma regra de acesso já
documentada em cada `feat_prot`.

### Onde mora o código de rota

`src/app/routes.tsx`, conforme já previsto na estrutura de pastas de `docs/arquitetura.md`.

---

## Consequências

### Positivas

- URL por tela: dá para atualizar a página, voltar/avançar no navegador e compartilhar link direto
  para uma tela — nenhum desses funcionava com um roteador feito à mão via `useState`.
- Guarda de rota por tipo de conta fica centralizada em um único lugar (`routes.tsx`), em vez de
  cada componente checar `account.type` por conta própria.
- Biblioteca madura, documentação extensa — reduz o tempo gasto reinventando navegação, que não é
  o objeto de estudo do projeto (diferente da decisão de "hooks próprios" do ADR 0003, que
  deliberadamente evita biblioteca para *aprender o mecanismo de busca de dado*).

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| Mais uma dependência externa | Aceitável: roteamento não é o foco de aprendizado do projeto (diferente do acesso a dado, coberto pelo ADR 0003) |
| Rotas placeholder até cada `feat_prot` ser construída de fato | Usar um componente `ComingSoon` genérico, identificando o `feat_prot` pendente, para a navegação já ser testável ponta a ponta |

---

## Alternativas consideradas

**Roteador feito à mão (`useState` com o nome da tela atual).** Rejeitada: sem URL, sem botão
voltar, sem link compartilhável — e o ganho de "aprender construindo" não se aplica aqui do mesmo
jeito que se aplica a buscar dado do Firestore (que é o núcleo do estudo).

**TanStack Router.** Alternativa moderna com tipagem de rota mais forte. Rejeitada por ora: menos
material de referência/exemplos disponíveis do que React Router, e o projeto já tem TypeScript
cobrindo boa parte do risco de erro de rota.
