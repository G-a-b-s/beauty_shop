# ADR 0011 — GitHub Pages também no pacote 2, com a configuração do Firebase em secrets

**Data:** 2026-11-06
**Status:** Aceito
**Estende:** [ADR 0010](0010-github-pages-para-o-prototipo.md) (GitHub Pages para o protótipo)
**Substitui:** a escolha de hospedagem do [ADR 0002](0002-persistencia.md) (Firebase Hosting). A
escolha do Firestore como persistência continua valendo.

---

## Contexto

O ADR 0010 publicou o protótipo no GitHub Pages, com escopo limitado ao pacote 1, e pediu uma
reavaliação na [`feat_data00`](../features/data/feat_data00-Autenticacao.md). Nesse momento a build
passa a exigir a configuração do Firebase (as seis variáveis `VITE_FIREBASE_*`).

Com isso, o argumento do ADR 0002 a favor do Firebase Hosting ("mesmo ecossistema") voltou à mesa.
A pergunta era se valia migrar a hospedagem agora ou manter o GitHub Pages.

---

## Decisão

**Manter o GitHub Pages**, publicado pelo GitHub Actions a cada push na `main`, também durante o
pacote 2.

A configuração do Firebase entra na build como **secrets do repositório**. O workflow
[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) passa os seis secrets como
variáveis de ambiente para o `npm run build`. O passo a passo para cadastrá-los está em
[`CONFIGURAR-SECRETS.md`](../../CONFIGURAR-SECRETS.md).

Nada muda no código. O `vite.config.ts` segue sem `base`, o caminho base continua vindo da linha de
comando e o fallback `404.html` continua resolvendo as rotas da SPA.

### Por que secrets, se os valores acabam públicos

O Vite embute toda variável `VITE_*` no JavaScript publicado, então a configuração web do Firebase
fica legível por quem inspecionar o site. Isso é esperado: esses valores só identificam o projeto e
não dão acesso aos dados. O secret serve para manter os valores fora do código, do histórico do Git
e dos logs do Actions, e para trocar de projeto sem commit.

Quem protege os dados são as **regras de segurança do Firestore** (`firestore.rules`, versionado no
repositório e publicado a cada `feat_data`), conforme o ADR 0002.

---

## Consequências

### Positivas

- Nenhuma migração de infraestrutura no meio do pacote 2: a mesma URL e o mesmo workflow continuam
  valendo.
- O deploy continua automático e sem credencial de deploy do Firebase no Actions. Só a configuração
  web, que não é segredo de acesso, entra no build.
- O Firebase Hosting continua disponível como alternativa. A troca não exige mudança de código.

### Negativas — e como mitigamos

| Consequência | Mitigação |
|---|---|
| Hospedagem e banco ficam em provedores diferentes | O app é estático e conversa direto com o Firebase pelo SDK; não há ganho técnico em hospedar no mesmo provedor |
| Sem os secrets, a build passa, mas o login falha no site publicado (`auth/invalid-api-key`) | Tabela de problemas comuns em `CONFIGURAR-SECRETS.md`; o log do Actions mostra `***` quando o secret foi encontrado |
| `firestore.rules` e `firestore.indexes.json` não são publicados pelo workflow | Publicação manual pelo autor a cada `feat_data`, a partir do computador pessoal. Automatizar exigiria uma credencial de deploy do Firebase no Actions, o que não compensa no escopo do estudo |
| O `404.html` responde com status HTTP 404 | Herdado do ADR 0010; afeta indexação, não uso |
| A `apiKey` pública pode ser usada a partir de outros sites | Opcional: restringir a chave aos domínios do Pages e do `localhost` no Google Cloud Console (descrito em `CONFIGURAR-SECRETS.md`) |

---

## Alternativas consideradas

**Firebase Hosting (ADR 0002).** Daria `rewrite` nativo para a SPA, sem o truque do `404.html`, e
permitiria publicar regras e hosting num mesmo `firebase deploy`. Rejeitada por ora: exigiria
configurar o `firebase.json` de hosting e guardar um token de deploy no Actions só para trocar um
host que já funciona.

**Arquivo `.env` versionado.** Rejeitada: os valores não são secretos, mas versioná-los amarra o
repositório a um projeto Firebase específico e vai contra a convenção de não commitar `.env`.

---

## Revisão

Reavaliar se o projeto precisar de algo que o GitHub Pages não oferece, como cabeçalhos HTTP
próprios, domínio com regras de redirecionamento ou deploy conjunto de regras e hosting.
