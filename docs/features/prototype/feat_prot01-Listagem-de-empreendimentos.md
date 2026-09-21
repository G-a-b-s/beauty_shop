# feat_prot01 — Listagem de empreendimentos

**Conta:** Cliente
**Pacote:** Protótipo (dado mockado, sem Firestore) — [ADR 0006](../../adr/0006-prototipo-antes-de-integracao-de-dados.md)
**Integração futura:** `feat_data01` (mesma tela, ligada ao Firestore)

---

## Objetivo

Primeira tela que o cliente vê após o login. Lista os empreendimentos (salões/barbearias)
disponíveis na plataforma, com busca por nome ou cidade.

## Regra de acesso

Só visível para conta do tipo **cliente**. Conta do tipo empreendimento ou profissional não vê
essa tela — ela navega direto para a própria área de gestão.

## Elementos de tela

- Campo de busca único, com placeholder "Buscar por nome ou cidade"
- Lista de cartões, um por empreendimento, mostrando: nome, cidade, telefone
- Cada cartão é clicável e leva ao `feat_prot02` (Detalhes do empreendimento)
- Estado vazio: mensagem "Nenhum empreendimento encontrado" quando a busca não retorna nada

## Dado mockado

Array fixo em `services/`, no formato da entidade `Business` (ver `docs/modelo-dominio.md`):

```ts
type Business = {
  id: string
  name: string
  phone: string
  address: string
  city: string
  active: boolean
}
```

Mock deve ter pelo menos 4–5 empreendimentos, em cidades diferentes, para a busca ter o que
filtrar de fato — não adianta mockar só 1.

## Interações

- Digitar no campo de busca filtra a lista em tempo real (sem botão de "buscar")
- Busca compara o texto digitado (case-insensitive, sem acento) contra `name` **e** `city`
- Só empreendimentos com `active: true` aparecem na lista

## Fora de escopo (por enquanto)

- Paginação — a lista mockada é pequena, não precisa
- Ordenação por distância/geolocalização
- Filtro por tipo de serviço oferecido (fica para uma iteração futura, se fizer sentido)
