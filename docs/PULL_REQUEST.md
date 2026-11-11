# feat: consolidar fundação YouCon People, segurança e Previews Next.js

A fundação oferece login Supabase real, autorização por organização/papel e Home autenticada. Gente & Gestão e dashboard continuam páginas vazias protegidas, sem processos da Etapa 02.

A migração específica `20261110203914` já foi aplicada e o primeiro acesso já foi vinculado após autorização anterior. HTTP confirmou People exposto, acesso anônimo bloqueado e schema auxiliar não exposto. A pessoa confirmou login e acesso Diretoria na Preview; não foram coletadas credenciais. Nenhuma migração, usuário ou objeto do Supabase foi alterado nesta consolidação.

Preserva o patch de segurança Next.js/eslint-config-next 16.4.1 e lockfile. Corrige o projeto Vercel e versiona `vercel.json` para Next.js SSR, `npm ci`, `npm run build` e saída automática, eliminando o erro de saída estática `public`. Mantém proteção Vercel e produção existentes. A Preview inicial foi enviada por API com o patch local; próximos pushes na feature branch usam a configuração versionada.

Atualiza README, setup, entrega e handoff, preserva evidências técnicas sem dados pessoais e propõe homologação Supabase isolada. A Preview atual usa banco compartilhado ativo; não equivale a homologação. Criar projeto, configurar Auth e aplicar migrações/fixtures em ambiente separado depende de aprovação específica.

## Validação

- Instalação pelo lockfile; lint sem avisos; TypeScript; 39 testes em seis arquivos; build Webpack/Next.js 16.4.1; diff check.
- Testes locais cobrem guardas, RLS/PGlite, isolamento, grants, revogação e preservação de estruturas legadas sintéticas.
- Dependências de produção sem vulnerabilidades reportadas. Pendência moderada transitiva minimatch no ferramental de lint.
- Login real inicial confirmado pela pessoa. Renovação/logout reais, todos os papéis e múltiplas organizações continuam pendentes de homologação.

Manter PR #1 aberto como rascunho, sem merge. Sem publicação em produção, nova migração remota, usuário real, alteração de Auth global ou implementação da Base Central. A migração antiga permanece arquivada; não executá-la.
