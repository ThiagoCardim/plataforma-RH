# Entrega — consolidação da fundação técnica

Estado em 11/11/2026, branch `feat/youcon-people-foundation`, PR #1 em rascunho, sem merge.

## Resultado

Fundação Next.js/Supabase preservada. Patch mínimo Next.js e eslint-config-next 16.4.0 → 16.4.1 com lockfile consistente. Nenhuma alteração de lógica de acesso, schema ou módulo funcional.

Documentação consolidada para distinguir migração/provisionamento já concluídos, conexão HTTP, login inicial validado pela pessoa e fluxos de sessão ainda pendentes. Os documentos antigos de preparação não são ordens para reaplicar migrações.

Vercel: projeto `plataformarh`, equipe `contato-youconprojets-projects`, corrigido para framework nextjs, build `npm run build`, install `npm ci`, saída/root automáticas. Configuração reproduzível em `vercel.json`, sem saída `public`/`out`. SSO, variáveis, domínios e implantações existentes preservados. Nenhuma promoção ou implantação de produção solicitada. Push na feature branch pode criar Preview pela integração Git.

## Escopo funcional

Login real, guardas de servidor, organização/vínculo/papéis e Home existentes. Base Gente & Gestão e dashboard continuam espaços vazios protegidos. Sem cadastro central, histórico de movimentações, solicitações, aprovação RH ou indicadores. Não há cadastro público nem bypass de autenticação.

## Verificação

Executar no checkout consolidado: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.

A auditoria e as verificações da consolidação passaram: lint sem avisos, TypeScript, 39 testes em seis arquivos e build Webpack/Next.js 16.4.1. Testes SQL usam PGlite com fixtures sintéticas; não aplicam migração remota. Dependências de produção sem vulnerabilidades reportadas; sete ocorrências moderadas na árvore de desenvolvimento derivam do advisory de minimatch. Não executado audit fix indiscriminado.

## Limitações e próximo passo

Login inicial e acesso Diretoria confirmados pela própria pessoa; logout/renovação reais e outros papéis ainda precisam de homologação. Schema privado não exposto; políticas/grants remotos verificados em leitura na auditoria. Nenhum objeto de Supabase foi alterado nesta consolidação.

A Preview existente usa o banco ativo compartilhado. Proposta de ambiente isolado em `HOMOLOGATION.md`; criação, custo, migração em homologação e contas sintéticas exigem autorização específica. Não copiar banco, usuários, chaves privadas ou dados de terceiros.

Fundação adequada para iniciar a modelagem da Base Central após autorização; ainda não homologada para operações de escrita ou produção. Revisar necessidade de índice composto no acesso People e dependência de desenvolvimento minimatch em tarefa própria. Não modificar objetos de outros apps para resolver avisos globais.
