# feat: fundação técnica da YouCon People

A plataforma inicia do zero com login Supabase Auth, sessão SSR, layout responsivo e Home baseada nas permissões do usuário. As rotas da Base de Gente & Gestão e do dashboard exigem permissões exclusivas de RH/Diretoria, inclusive no acesso direto por URL. Vínculos contratuais CLT/estágio/PJ ficam separados de papéis acumuláveis por organização.

A migração cria o núcleo multi-organização com RLS em todas as tabelas, grants somente de leitura para usuários e constraint que impede atribuir permissões gerenciais à liderança. Não há cadastro público, autenticação simulada, dados reais, módulos completos ou indicadores fictícios. Sem variáveis Supabase, o login apresenta estado de configuração pendente e as rotas protegidas redirecionam para o login.

Validação: lint, TypeScript estrito, 25 testes em Vitest (incluindo execução de SQL/RLS no PostgreSQL PGlite), build de produção Next.js/Webpack e verificações HTTP passaram. Turbopack foi substituído por Webpack devido à restrição de portas internas do ambiente. Validação visual em navegador e Auth/Data API/advisors no Supabase hospedado permanecem pendentes da configuração externa.

Revisar docs/SETUP.md, docs/ARCHITECTURE.md, docs/DELIVERY.md e docs/FILES.md. Não publicar produção ou integrar automaticamente à main.

Base pretendida: main. Branch: feat/youcon-people-foundation. Envio autorizado pelo proprietário; criar como draft, sem merge ou publicação.

Revisão de arquivos gerados: versionar AGENTS.md conforme orientação do Next.js; ignorar next-env.d.ts e executar next typegen antes do TypeScript, evitando alterações de caminhos de desenvolvimento/produção no Git.
