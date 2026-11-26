<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proteção permanente do Supabase compartilhado

YouCon People usa o projeto Supabase existente, compartilhado com outra aplicação ativa. Não criar outro projeto nem planejar migração para outro banco. Respeitar `youcon_people` e `youcon_people_private`; não criar objetos em `public` nem modificar objetos, registros, funções, triggers, RLS ou permissões de qualquer aplicação.

Na Etapa 02, **nenhuma alteração no Supabase está autorizada**: não executar migrações, seeds, resets, escritas, DDL ou testes que gravem no projeto compartilhado; não alterar Auth global, Storage, API, extensões ou configurações compartilhadas. Não usar credenciais administrativas para contornar restrições. Somente leitura técnica estritamente necessária é permitida. Testes existentes em PGlite usam banco efêmero local com dados sintéticos, nunca o Supabase compartilhado.

Mudança futura exige apresentação prévia de impacto, objetos afetados, SQL e recuperação, seguida de autorização específica. Preservar autenticação, guardas de servidor, papéis e diferenças CLT/estágio/PJ. Gente & Gestão e dashboard são exclusivos de RH/Diretoria. Não implementar módulos operacionais nesta etapa. Não fazer merge nem publicar em produção.

## Escopo autorizado — Etapa 03B

O pedido desta etapa autoriza as telas da Base Central de Pessoas com dados fictícios exclusivamente locais e simulação em memória, incluindo consulta/cadastro/edição por RH e Diretoria. Ver docs/stage-03b/DECISOES.md para as regras D01–D15 consolidadas. As guardas reais de servidor devem ser preservadas; não liberar rotas para Profissional/Liderança nem introduzir bypass de autenticação para demonstração. Testes de navegador usam somente Auth/Data API sintéticos em loopback, fora da aplicação.

Nenhuma escrita, alteração de schema, Auth, RLS, Storage, grants ou configuração do Supabase está autorizada. Sem novo Supabase, merge ou produção. Preview protegida e PR em rascunho estão autorizados. Cadastro demonstrativo não usa armazenamento persistente nem altera a conta autenticada.

## Homologação — autorização permanente (26/11/2026)

O usuário autorizou permanentemente a atualização automática do link fixo **https://youcon-people-preview.vercel.app** após cada implementação ou ajuste solicitado. **Não solicitar nova autorização por entrega.** Esta orientação substitui exclusivamente as exigências anteriores de aprovação manual por versão para trocar esse alias; não substitui aprovações de conteúdo, decisões de negócio ou autorizações de outros ambientes. Preservá-la ao trabalhar em outras branches. Fluxo detalhado: [docs/PREVIEW.md](docs/PREVIEW.md).

Ao concluir cada tarefa:

1. Executar e registrar validações proporcionais à alteração. Não usar dados reais ou o Supabase compartilhado para testes.
2. Preparar o commit exato em branch de funcionalidade, sem merge. Confirmar deployment **READY**, SHA, branch, equipe/projeto corretos e ambiente **Preview**; nunca escolher apenas o deployment mais recente, um build em andamento ou produção.
3. Conferir a proteção existente, os guardas/autenticação da aplicação e o destino anterior do alias. Não desabilitar login, modificar permissões, gerar links/tokens de bypass ou usar links de compartilhamento que contornem a proteção.
4. Satisfeitas as verificações obrigatórias, apontar **somente** `youcon-people-preview.vercel.app` ao deployment validado, sem pedir confirmação. Se já estiver correto, verificar e manter a atribuição, sem operação redundante.
5. Reconsultar o alias e a proteção, confirmar que produção permanece inalterada e conservar o deployment anterior para recuperação. Informar resumidamente as alterações, as validações e o link fixo atualizado.

Se qualquer validação obrigatória falhar ou não puder ser confirmada, manter a versão anterior e informar o impedimento; não publicar uma versão alternativa silenciosamente. Se a troca falhar, verificar o destino efetivo antes de agir e, se necessário, recuperar apenas o alias de Preview para o deployment anterior conhecido. Não usar promoção/rollback de produção.

**Limites absolutos:** esta autorização é exclusiva da homologação. Não autoriza alterações no Supabase, Auth/RLS/grants/dados remotos, produção, portal operacional, outra aplicação, permissões de acesso, migrations/seeds ou merges. Não ampliar a automação para esses alvos.
