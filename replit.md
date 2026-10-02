# Flavio Nhoato — Versos do Tempo

Blog pessoal de textos com publicação, leitura acessível e compartilhamento.

A maioria dos textos são ideias e divagações, embora também haja poemas. Nos cabeçalhos e nas boas-vindas, usar “texto/textos” em vez de “poema/poesia”.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

- Flávio tem centenas de poemas; serão adicionados aos poucos.
- O celular será o principal dispositivo usado pelo autor para publicar e compartilhar diariamente.
- A direção escolhida é Editorial: fundo preto, detalhes verde-lima, monograma FN e controles suaves; a primeira proposta azul e dourada foi rejeitada.
- Manter o tamanho dos poemas; reduzir o tamanho das fontes dos menus, metadados e controles ao redor.
- A apresentação do blog deve usar o nome completo informado para a marca e uma introdução ampliada na página inicial, sem biografia inventada.
- Remover Instagram das propostas e do design escolhido; manter Facebook, WhatsApp, e-mail e cópia de URL.
- Publicação em janela sobreposta, blocos reordenáveis e arquivo por ano, mês e dia.

## Gotchas

- Exigir acesso verificado e autorização exclusiva do autor para qualquer escrita, inclusive na prévia. Visitantes e contas sem autorização apenas leem e compartilham.
- O autor tem textos muito longos: mostrar somente o começo na lista e abrir a leitura completa em janela sobreposta. Os links compartilhados devem abrir diretamente essa janela do texto correspondente.
- Os três textos iniciais são demonstrações, não obras de Flávio. Não remover essa identificação nem atribuir os exemplos ao autor.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
