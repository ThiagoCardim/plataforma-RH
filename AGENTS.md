<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proteção permanente do Supabase compartilhado

YouCon People usa o projeto Supabase existente, compartilhado com outra aplicação ativa. Não criar outro projeto nem planejar migração para outro banco. Respeitar `youcon_people` e `youcon_people_private`; não criar objetos em `public` nem modificar objetos, registros, funções, triggers, RLS ou permissões de qualquer aplicação.

Na Etapa 02, **nenhuma alteração no Supabase está autorizada**: não executar migrações, seeds, resets, escritas, DDL ou testes que gravem no projeto compartilhado; não alterar Auth global, Storage, API, extensões ou configurações compartilhadas. Não usar credenciais administrativas para contornar restrições. Somente leitura técnica estritamente necessária é permitida. Testes existentes em PGlite usam banco efêmero local com dados sintéticos, nunca o Supabase compartilhado.

Mudança futura exige apresentação prévia de impacto, objetos afetados, SQL e recuperação, seguida de autorização específica. Preservar autenticação, guardas de servidor, papéis e diferenças CLT/estágio/PJ. Gente & Gestão e dashboard são exclusivos de RH/Diretoria. Não implementar módulos operacionais nesta etapa. Não fazer merge nem publicar em produção.
