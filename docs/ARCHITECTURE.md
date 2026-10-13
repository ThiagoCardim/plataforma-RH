# Arquitetura e segurança

## Organização

`src/app` contém rotas App Router; o grupo `(platform)` contém o layout autenticado e `/home`, `/gente-gestao` e `/gente-gestao/dashboard`. `src/components/ui` contém os componentes locais shadcn/ui; `components/auth` contém formulário e Server Actions; `components/layout` contém shell e navegação. `src/lib/supabase` separa clientes SSR/browser e tipos. `src/modules/access` contém a política de navegação e a consulta de autorização no servidor. Futuras funcionalidades devem ter módulos próprios sem expandir indiscriminadamente esse núcleo.

Fluxo: login → `signInWithPassword` → cookies SSR → `getUser` → vínculo ativo → papéis/permissões no PostgreSQL → rota e navegação. `React.cache` deduplica somente no contexto da renderização; não há cache global de usuários ou sessão. Rotas autenticadas são dinâmicas e respostas do proxy usam `Cache-Control: private, no-store`. O proxy preserva cookies e cabeçalhos de cache do SDK ao renovar a sessão.

`getSession` e `user_metadata` não são usados para decisões de autorização. O guard de página continua obrigatório mesmo com o layout protegido. Falhas de consultas não concedem acesso. Server Actions usam proteção de origem do Next.js; a troca de organização revalida usuário e vínculo no banco. O cookie de organização é apenas seleção de contexto, nunca uma autorização.

## Modelo

- `organizations`: cada ambiente isolado, sem recursos de franquias.
- `profiles`: nome de exibição mínimo por usuário Supabase; leitura apenas do próprio perfil. Sem dados pessoais sensíveis adicionais.
- `memberships`: vínculo do usuário à organização, com `contract_type` (`clt`, `intern`, `pj`) e estado `active`.
- `roles`: `professional`, `leadership`, `hr`, `director`.
- `membership_roles`: papéis acumuláveis por vínculo. FK composta impede atribuir papéis de um vínculo a outro usuário.
- `permissions`, `role_permissions`: catálogo de capacidades. Constraint impede conceder permissões gerenciais a papéis diferentes de RH/Diretoria.

CLT, estágio e PJ são vínculos contratuais, não níveis de acesso. Uma liderança que também recebeu papel RH passa a ter a permissão RH, conforme atribuição autorizada. Não existem benefícios ou obrigações exclusivos de CLT apresentados a PJ na etapa 01; módulos futuros precisarão aplicar elegibilidade contratual além da autorização, no servidor e no banco.

| Papel        | Home | Base Gente & Gestão | Dashboard gerencial |
| ------------ | ---- | ------------------- | ------------------- |
| Profissional | Sim  | Não                 | Não                 |
| Liderança    | Sim  | Não                 | Não                 |
| RH           | Sim  | Sim                 | Sim                 |
| Diretoria    | Sim  | Sim                 | Sim                 |

## Banco e RLS

Todas as sete tabelas públicas têm RLS. `anon` não tem privilégios. `authenticated` recebe somente SELECT, sujeito às policies: organizações de vínculos ativos, vínculos próprios, papéis próprios ativos e perfil próprio. Catálogos não contêm dados pessoais. Não há políticas de escrita para usuários, incluindo RH e Diretoria; nesta etapa a administração é operacional, fora da aplicação, por operador confiável.

`private.has_permission(organization_id, permission_code)` usa SECURITY INVOKER, `search_path` vazio, a identidade `auth.uid()` e consultas protegidas pelas RLS; não contorna RLS. A função fica em schema não exposto pela Data API. Não há views ou funções SECURITY DEFINER. Não há chave privilegiada no aplicativo.

Não existe tabela de pessoas confidenciais ou de indicadores nesta entrega. Ao criar futuramente uma tabela gerencial, incluir `organization_id` NOT NULL, FK, índices e RLS; o predicado obrigatório será `private.has_permission(organization_id, 'people.management.view')`. Dashboards deverão exigir `people.dashboard.view`, inclusive em consultas e endpoints. Nunca usar apenas uma política de pertencimento à organização para dados gerenciais. As políticas atuais não autorizam leituras de perfis de terceiros, mesmo para RH.

A desativação de vínculo ou remoção de papel é lida imediatamente nas novas consultas, sem aguardar renovação de claims de papel. O Auth valida o usuário via rede. Revogação de sessões, exclusão de usuários e configuração de expiração de JWT continuam sendo responsabilidade do operador no Supabase; a autorização em futuras operações críticas deve conferir também a sessão quando necessário.

## Testes

`tests/rls.test.ts` executa a migração em PGlite (PostgreSQL real em WASM), com os papéis `anon`, `authenticated` e `service_role` e uma função `auth.uid()` compatível com as fixtures. Valida RLS, grants, roles acumulados, revogação, vínculos inativos, anonimato, perfis próprios e isolamento de organizações. `tests/access.test.ts` testa as guardas de rota com o cliente Supabase substituído somente no teste. A aplicação não contém mocks.

Esse teste não equivale a validar Supabase hospedado: após provisionar, executar os mesmos cenários com usuários de teste, tokens reais, Data API e Auth, além dos advisors. Não usar dados reais nessa validação.
