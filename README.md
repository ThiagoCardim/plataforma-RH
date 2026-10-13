# YouCon People — Etapa 01

Fundação técnica da plataforma de Gestão de Pessoas da YouCon. Next.js App Router, TypeScript estrito, Tailwind CSS, componentes shadcn/ui locais e Supabase Auth/PostgreSQL. Compatível com Vercel; nenhuma publicação automática.

## Executar e visualizar

Requer Node.js 22 ou superior e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Em uma execução no seu próprio computador, abra http://localhost:3000. No ambiente cloud do Codex, use a prévia com encaminhamento de porta quando disponível; o localhost da nuvem não é acessível diretamente pelo navegador do seu computador. Sem variáveis válidas, a tela de login mostra **Acesso em preparação**, o formulário fica desabilitado e `/home` redireciona para `/login`. Não existe autenticação simulada, usuário de demonstração ou bypass de acesso. O texto de marca é um espaço reservado; substituir pela identidade oficial quando fornecida.

Para usar a Home autenticada, configure o projeto Supabase, aplique a migração e provisione uma organização e um usuário autorizado conforme [SETUP](docs/SETUP.md). O primeiro vínculo ativo é selecionado por padrão; o seletor permite alternar entre organizações autorizadas.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

O build usa Webpack porque o Turbopack exige portas internas indisponíveis neste ambiente. Nenhuma mudança no App Router ou no comportamento da aplicação. O lockfile e as versões exatas devem ser mantidos.

## Entrega

- Login por e-mail e senha via Supabase Auth, logout e atualização de cookies em `src/proxy.ts`.
- Verificação de identidade com `getUser()` no servidor e guarda de permissões em cada página protegida.
- Shell responsivo com sidebar, cabeçalho, menu móvel e Home baseada no contexto real de acesso.
- Estados de carregamento, vazio, erro, acesso negado e página inexistente.
- Tokens reutilizáveis e componentes Button, Input e Card seguindo shadcn/ui.
- Organizações, perfis mínimos, vínculos contratuais, papéis acumuláveis e permissões com RLS e grants restritos.
- Base de Gente & Gestão e dashboard são apenas espaços vazios protegidos nesta etapa.
- Testes de guardas do servidor, configuração e SQL/RLS com PGlite. Fixtures de testes não são seeds de aplicação.

Consulte [arquitetura e permissões](docs/ARCHITECTURE.md), [design system](docs/DESIGN_SYSTEM.md), [relatório da entrega](docs/DELIVERY.md) e [inventário de arquivos](docs/FILES.md).

## Limites

Não foram implementados módulos completos, cadastros de pessoas, indicadores, importações, funcionalidades de franquias ou integrações externas simuladas. Storage não é necessário nesta etapa. Nenhum dado real de colaborador é incluído.

O login ponta a ponta exige um Supabase configurado; os testes locais de PostgreSQL não validam o serviço hospedado de Auth, envio de e-mail ou configuração do projeto remoto. Não há tela de cadastro público nem provisionamento privilegiado no navegador.

`AGENTS.md` mantém as instruções oficiais do Next.js para agentes. `next-env.d.ts` e `.next/` não são versionados; `npm run typecheck` executa `next typegen` para preparar os tipos também em checkouts novos.
