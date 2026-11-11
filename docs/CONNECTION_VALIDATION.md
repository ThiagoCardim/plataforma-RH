# Validação da conexão — 11/11/2026

Registro das verificações iniciais; o estado atual está em [CONTINUE.md](CONTINUE.md). As pendências de login abaixo foram posteriormente encerradas para o primeiro acesso, conforme atualização ao final.

Branch `feat/youcon-people-foundation`, base `6120eb3`. Sem publicação, merge, migração, provisionamento ou alteração de Auth/banco remoto.

## Ambiente e HTTP

- Instância `ccarenv_b64_Y2NhcmVudl9kZGE3YmVkOTQxZDg4MTkxYjFhYThkZDlhNzg2NTA1MQ`: observações atuais, revisão 1, política `enforced`, host `ewdgraxksonxtrylxpbd.supabase.co` permitido.
- `.env.local` recriado com chave publishable ativa obtida pela integração Supabase; arquivo ignorado pelo Git. Nenhuma chave registrada neste documento.
- `GET /auth/v1/health` com apikey: HTTP 200, GoTrue v2.197.0.
- `GET /rest/v1/memberships?select=id&limit=1`, `Accept-Profile: youcon_people`, sem sessão: HTTP 401, código `42501`, `permission denied for schema youcon_people`. Recusa anônima esperada; schema exposto confirmado, sem leitura de dados pessoais.
- Mesma consulta com `Accept-Profile: youcon_people_private`: HTTP 406, `PGRST106`. A resposta lista somente `public, graphql_public, youcon_people`; auxiliar não exposto.
- `fetch` padrão do Node retornou `EAI_AGAIN`. `NODE_USE_ENV_PROXY=1` mantém o proxy herdado: health HTTP 200 e supabase-js retorna a mesma recusa anônima `401/42501`. Usar `NODE_USE_ENV_PROXY=1 npm run dev` neste ambiente; não é uma alteração da aplicação nem uma exigência de produção.
- Consulta ao changelog em `supabase.com` bloqueada pelo proxy (CONNECT 403); não houve implementação de recurso Supabase nem contorno da política.

## Dependências e validação local

- `npm ci --cache /workspace/work/npm-cache`: 420 pacotes instalados pelo lockfile, sem mudança nas dependências. Cache padrão não era gravável.
- `npm test`: 39 testes passaram; `npm run lint` e `npm run typecheck` passaram.
- Chromium automatizado confirmou `/login` com título `Acesso | YouCon People`, formulário configurado e sem erros JavaScript; `/home` sem sessão redireciona para `/login`.
- Não houve envio de credenciais de usuário, criação de sessão Auth ou teste de senha real.

## Pendência de login acompanhado

O desktop compartilhado está habilitado na configuração, mas não há ferramenta desktop JS ou `open_in_codex` disponível nesta sessão. A tentativa concreta `cloud-agent-browser-runtime activate` falhou com `NODE_REPL_AUTH_TOKEN must be provisioned before browser activation`. Chromium automatizado permite verificar a interface, mas não substitui a pessoa digitando sua senha no navegador compartilhado.

Próximo passo: disponibilizar o desktop compartilhado nesta instância e abrir a tela de login para a pessoa autenticar diretamente, sem senha no chat. Depois validar acesso ao vínculo existente, permissões, cookies e logout local. Não recriar conta/vínculo, trocar senha, revogar sessões globais ou alterar configurações compartilhadas. Login positivo, renovação de sessão e logout com sessão real continuam sem validação.

O comando de desenvolvimento também emitiu recomendação de atualização de segurança do Next.js 16.4.0 e interrompeu uma inicialização. Nenhuma atualização foi aplicada nesta validação; revisar o advisory e a versão corrigida antes de implantação.

## Atualização posterior

A limitação do desktop descrita acima permaneceu, mas foi disponibilizada Preview protegida na Vercel. A própria pessoa confirmou login e navegação à organização/Diretoria por imagens. Isso encerra a pendência de login inicial, sem certificar renovação, logout ou sessões de outros apps. Estado consolidado em CONTINUE.md; não solicitar nova senha nem novo provisionamento.
