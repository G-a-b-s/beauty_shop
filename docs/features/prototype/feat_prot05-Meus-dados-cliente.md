# feat_prot05 — Meus dados (cliente)

**Conta:** Cliente
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data05`

---

## Objetivo

Permitir que o cliente veja e edite os próprios dados cadastrais: nome e telefone. E-mail e CPF
não são editáveis aqui (ver abaixo).

## Regra de acesso

Só cliente, e só os próprios dados — não existe tela de "editar outro cliente".

## Elementos de tela

- Formulário pré-preenchido com os dados atuais: nome, telefone
- E-mail exibido, mas **somente leitura** (mudar e-mail implica mudar a credencial de login no
  Firebase Auth — fora de escopo deste protótipo)
- CPF exibido, mas **somente leitura** (é identificador, não deveria mudar depois do cadastro)
- Botão "Salvar"

## Dado mockado

Reaproveita o mock de `Customer` (o "cliente logado" simulado):

```ts
type Customer = {
  id: string
  name: string
  phone: string
  cpf: string
}
```

## Interações

- Editar nome/telefone e clicar "Salvar" atualiza o mock em memória e mostra confirmação (ex.:
  toast "Dados atualizados")
- Validação simples: nome não pode ficar vazio

## Fora de escopo (por enquanto)

- Trocar e-mail ou senha (fluxo separado do Firebase Auth, não é dado de perfil)
- Excluir conta
