# Continuidade — fundação YouCon People

Estado consolidado em 11/11/2026. Repositório `ThiagoCardim/plataforma-RH`, branch `feat/youcon-people-foundation`, PR #1 aberto como rascunho, sem merge. A main permanece no commit inicial. Não iniciar nova aplicação.

## Implementado e verificado

- Next.js/eslint-config-next 16.4.1 e lockfile revisado; patch de segurança preservado.
- Auth Supabase real, guardas no servidor, contexto de organização, vínculos CLT/estágio/PJ e papéis Profissional/Liderança/RH/Diretoria.
- Migração `20261110203914` aplicada ao projeto autorizado `ewdgraxksonxtrylxpbd`; ver `MIGRATION_APPLIED.md`. Não reaplicar, resetar ou reconciliar histórico compartilhado.
- Sete tabelas `youcon_people`, todas com RLS; authenticated tem somente SELECT sujeito às políticas, anon sem acesso. Helper SECURITY INVOKER em `youcon_people_private`.
- Data API confirmada por HTTP: People exposto, recusa anônima 401/42501; auxiliar fora da API, 406/PGRST106.
- Primeiro acesso existente já vinculado; organização e papel Diretoria confirmados pela pessoa na Preview. Não criar outra conta nem repetir provisionamento. Nenhum dado pessoal nos documentos.
- Home e navegação funcionais. Gente & Gestão e dashboard são páginas vazias protegidas, sem cadastro/indicadores. Demais módulos são visuais.
- Lint, TypeScript, 39 testes em seis arquivos e build passaram; ver `DELIVERY.md`.

## Vercel

Projeto `plataformarh`, equipe `contato-youconprojets-projects`. Preview inicial READY:
https://plataformarh-mlshnwglz-contato-youconprojets-projects.vercel.app/login

SSO Vercel preservado. Somente URL/chave publishable configuradas em Preview; `.env.local` ignorado. Existe implantação histórica de produção do commit inicial, sem People. Não promover Preview.

Configuração corrigida no projeto e em `vercel.json`: Next.js, `npm ci`, `npm run build`, outputDirectory null. Push da branch pode iniciar nova Preview; registrar o resultado no handoff. Na API Vercel, omitir target cria Preview; não usar target production ou staging.

## Pendências reais

1. Homologação Supabase separada: somente proposta em `HOMOLOGATION.md`, sem criação ou migração autorizada por este documento.
2. Sessões reais: validar renovação, logout local, preservação das sessões de outros apps, todos os papéis e múltiplas organizações em homologação. Login inicial não equivale a esses testes completos.
3. Aviso moderado transitivo minimatch no ferramental de lint; zero vulnerabilidades reportadas nas dependências de produção em 11/11. Índice composto da FK de membership_roles recomendado pelo advisor; nenhum SQL de correção aplicado.
4. Avisos de objetos de outros apps no banco compartilhado ficam com os responsáveis; não alterá-los.
5. Modelagem da Base Central será próxima entrega autorizada, separando pessoa, conta Auth, unidade e histórico de vínculos. Nada da Etapa 02 funcional foi implementado.

## Retomar em outro ambiente

Conferir status/rede aplicada e branch remota. `npm ci` pelo lockfile; se o cache padrão não for gravável, usar cache em `work/`. Recriar variáveis ignoradas por integração autorizada, sem exibi-las. Preservar proxy e CA; neste cloud, iniciar com `NODE_USE_ENV_PROXY=1 npm run dev`. O desktop compartilhado falhou por ausência de NODE_REPL_AUTH_TOKEN; não inventar token nem contornar a política.

Preservar `AGENTS.md`. Não alterar Auth global, dados legados, demais schemas, chaves, gatilhos ou Storage. Sem merge, produção, migração remota ou usuário real novo sem autorização específica. Histórico técnico em `CONNECTION_VALIDATION.md` e `PREVIEW_AND_SECURITY.md`.

## Runtime reproduzível

O primeiro build automático da consolidação mostrou que engines >=22 sobrepunha Node 24.x do projeto e selecionava Node 26.x na Vercel. Engines foi restringido a 24.x no package.json e lockfile, alinhando runtime local e remoto. Não muda dependências funcionais nem exige configuração do Supabase.

## Etapa 02 — evolução visual

A etapa visual parte da fundação `19cae87` na branch `feat/youcon-people-design-system`. Consulte [entrega da Etapa 02](STAGE_02_DELIVERY.md). A autorização atual exige manter o Supabase compartilhado existente e proíbe qualquer alteração nele; propostas históricas de criar homologação separada não são o plano desta etapa. Não criar novo projeto, executar migração remota ou provisionar registros. AGENTS.md e SHARED_DATABASE.md registram a regra permanente.
