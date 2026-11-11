# YouCon People — Etapa 01

Fundação técnica da plataforma de Gestão de Pessoas da YouCon. Next.js App Router, TypeScript estrito, Tailwind CSS, componentes shadcn/ui locais e Supabase Auth/PostgreSQL. Next.js e eslint-config-next fixados em 16.4.1. Preview protegida na Vercel; sem publicação da aplicação People em produção. Push na branch pode iniciar Preview automática pela integração Git.

## Executar e visualizar

Requer Node.js 24.x e npm; engines fixa a mesma versão principal usada na Vercel e nas verificações.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Em uma execução no seu próprio computador, abra http://localhost:3000. No ambiente cloud do Codex, use a prévia com encaminhamento de porta quando disponível; o localhost da nuvem não é acessível diretamente pelo navegador do seu computador. Sem variáveis válidas, a tela de login mostra **Acesso em preparação**, o formulário fica desabilitado e `/home` redireciona para `/login`. Não existe autenticação simulada, usuário de demonstração ou bypass de acesso. O texto de marca é um espaço reservado; substituir pela identidade oficial quando fornecida.

O Supabase autorizado já está conectado: migração específica aplicada, schema People exposto e primeiro vínculo provisionado. O login real e o acesso à organização/Diretoria foram confirmados pela pessoa na Preview. **Não repetir migração ou provisionamento.** Consulte [estado e retomada](docs/CONTINUE.md), [configuração](docs/SETUP.md) e [evidências da conexão](docs/CONNECTION_VALIDATION.md). O primeiro vínculo ativo é selecionado por padrão; o seletor suporta outras organizações autorizadas, ainda sem validação ponta a ponta com múltiplas organizações.

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
- Organizações, perfis mínimos, vínculos contratuais, papéis acumuláveis e permissões em `youcon_people`, com RLS e grants restritos; função auxiliar em `youcon_people_private`.
- Armazenamento de sessão exclusivo `youcon-people-auth` e logout de sessão local, preservando as sessões dos outros aplicativos.
- Base de Gente & Gestão e dashboard são apenas espaços vazios protegidos nesta etapa.
- Testes de guardas do servidor, configuração e SQL/RLS com PGlite. Fixtures de testes não são seeds de aplicação.

Consulte [arquitetura e permissões](docs/ARCHITECTURE.md), [design system](docs/DESIGN_SYSTEM.md), [plano para banco compartilhado](docs/SHARED_DATABASE.md), [relatório da entrega](docs/DELIVERY.md) e [inventário de arquivos](docs/FILES.md).

## Limites

Não foram implementados módulos completos, cadastros de pessoas, indicadores, importações, funcionalidades de franquias ou integrações externas simuladas. Storage não é necessário nesta etapa. Nenhum dado real de colaborador é incluído.

O login real inicial foi validado, mas renovação de sessão, logout real e cenários com todos os papéis ainda exigem homologação. Os testes locais de PostgreSQL não validam esses fluxos hospedados. Não há tela de cadastro público nem provisionamento privilegiado no navegador.

`AGENTS.md` mantém as instruções oficiais do Next.js para agentes. `next-env.d.ts` e `.next/` não são versionados; `npm run typecheck` executa `next typegen` para preparar os tipos também em checkouts novos.

## Vercel e homologação

`vercel.json` fixa o framework Next.js, instalação por `npm ci`, build por `npm run build` e saída automática (`outputDirectory: null`). O projeto Vercel `plataformarh`, equipe `contato-youconprojets-projects`, usa a mesma configuração. Não usar `public`, `out` ou exportação estática: login SSR e Server Actions precisam do runtime Next.js. A configuração de build vale para implantações futuras; não promove nem altera implantações existentes. Manter Node 24.x no projeto Vercel, versão usada nas verificações.

A Preview atual usa o banco compartilhado ativo e **não é um banco de homologação**. Novas escritas e fixtures devem ser validadas em ambiente separado conforme a [proposta de homologação](docs/HOMOLOGATION.md), ainda não provisionado. Não copiar `.env.local`, usuários ou dados pessoais do banco ativo para testes.

No ambiente cloud atual, usar `NODE_USE_ENV_PROXY=1 npm run dev` com o proxy herdado. O desktop compartilhado falhou no provisionamento; a Preview HTTPS é a alternativa disponível. Nunca pedir senha no chat.
