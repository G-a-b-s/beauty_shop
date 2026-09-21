# ADR 0010 — GitHub Pages para hospedar o protótipo

**Data:** 2026-09-19
**Status:** Aceito
**Escopo:** apenas o pacote 1 (protótipo). Não substitui o Firebase Hosting do [ADR 0002](0002-persistencia.md)

---

## Contexto

O ADR 0002 escolheu **Firebase Hosting**, pelo argumento de ficar "no mesmo ecossistema" do
Firestore. Só que, durante o pacote 1, esse argumento não se aplica: com a autenticação mockada
([ADR 0009](0009-autenticacao-mockada-no-prototipo.md)) e todos os dados em memória, o Firebase
saiu inteiramente do bundle — o protótipo é um site **estático puro**, sem nenhuma credencial.

A necessidade agora é só uma: ter um link para mostrar o protótipo funcionando.

---

## Decisão

Publicar o protótipo no **GitHub Pages**, por GitHub Actions, a cada push na `main`.

A decisão é **escopada ao pacote 1**. Quando o Firestore entrar (pacote 2), reavalia-se: o
GitHub Pages continua viável — as credenciais do Firebase entrariam como *secrets* do Actions no
momento da build — mas aí o argumento do "mesmo ecossistema" do ADR 0002 volta a pesar.

### Caminho base

O GitHub Pages serve um site de projeto em `usuario.github.io/<repo>/`, então os assets precisam
ser resolvidos a partir desse prefixo. Em vez de fixar o nome do repositório no
`vite.config.ts`, o workflow passa o caminho na linha de comando:

```
npm run build -- --base=/${{ github.event.repository.name }}/
```

Assim o `vite.config.ts` segue sem `base` (desenvolvimento local e qualquer outro host continuam
funcionando), e renomear o repositório não quebra a publicação.

### Rotas da SPA

O GitHub Pages não tem reescrita de rota: abrir `/businesses` direto, ou recarregar a página em
qualquer rota, devolveria 404. O workflow copia `index.html` para `404.html` — o Pages serve esse
arquivo para todo caminho desconhecido, o React Router lê a URL e monta a tela certa.

Foi preferido a trocar por `HashRouter` porque **não muda uma linha do código** e mantém as URLs
limpas — inclusive se o projeto migrar para o Firebase Hosting, onde o equivalente é uma regra de
`rewrite`.

---

## Consequências

### Positivas

- Link público para demonstrar o protótipo, sem configurar infraestrutura nem gastar cota.
- Publicação automática a cada push, sem etapa manual.
- Nenhuma credencial exposta: não há `.env` na build do pacote 1.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| **Os dados somem ao recarregar** — o mock vive em memória | É o comportamento esperado de um protótipo; a tela de login exibe as contas de demonstração para recomeçar |
| Qualquer visitante com o link acessa a demonstração | Não há dado real nem credencial real — as contas são fictícias ([ADR 0009](0009-autenticacao-mockada-no-prototipo.md)) |
| O `404.html` responde com status HTTP 404 embora renderize a tela certa | Irrelevante para um protótipo; afeta indexação, não uso |
| Duas hospedagens documentadas (Pages agora, Firebase Hosting previsto) | Este ADR é explicitamente escopado ao pacote 1, e o ADR 0002 segue válido para o futuro |

---

## Alternativas consideradas

**Firebase Hosting desde já (ADR 0002).** Funcionaria, mas exigiria configurar o projeto de
hosting e o deploy para servir um site que, nesta fase, nem usa Firebase. Adiado para quando o
Firestore entrar.

**`HashRouter`.** À prova de falhas em qualquer host estático, sem truque de 404. Rejeitada:
sujaria as URLs (`/#/businesses`) e provavelmente seria revertida na migração.

**Deploy manual para a branch `gh-pages`.** Rejeitada: etapa manual, fácil de esquecer, e deixa
artefato de build versionado no repositório.

---

## Revisão

Reavaliar ao iniciar o pacote 2 ([`feat_data00`](../features/data/feat_data00-Autenticacao.md)),
quando a build passar a exigir as credenciais do Firebase.
