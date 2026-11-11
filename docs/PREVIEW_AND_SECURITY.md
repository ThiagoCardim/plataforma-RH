# Navegador, prévia e segurança — 11/11/2026

## Diagnóstico do navegador compartilhado

A instância continua a mesma de `CONNECTION_VALIDATION.md`, com política aplicada e observações atuais. A capacidade `remote_desktop` é declarada habilitada, mas seu estado observado permanece `unknown`.

- Não há ferramenta desktop JS, `open_in_codex` ou encaminhamento de portas disponível no catálogo desta sessão.
- `cloud-agent-browser-runtime activate` falha novamente: `NODE_REPL_AUTH_TOKEN must be provisioned before browser activation`.
- `cloud-agent-browser-runtime show` informa que o launcher Orbit exige `ORBIT_OS=true` e `BROWSER_HEADLESS=false`; `cloud-agent-desktop --help` retorna `Orbit desktop is unavailable`.
- O caminho configurado para o socket de gerenciamento do navegador não existe. Não foram inventados tokens, alteradas variáveis internas ou criados serviços de controle alternativos.

Conclusão: falha de provisionamento/ativação do desktop, anterior à navegação e independente do login People. A interface da aplicação já foi verificada em Chromium automatizado, mas não se confunde com um desktop interativo acessível pela pessoa. Foi solicitado testar a abertura do Desktop pelo painel do Codex, se disponível.

## Revisão e correção do Next.js

O endpoint oficial de advisories do npm confirmou três avisos para Next.js 16.4.0. Conferência adicional na GitHub Advisory Database:

| Advisory | Impacto e aplicabilidade |
| --- | --- |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | DoS em App Router com Server Actions. Aplicável: a aplicação usa Server Actions no login e logout. |
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | RCE na otimização de imagens com SVG, em Linux/glibc. Não foi encontrado uso de `next/image` ou `dangerouslyAllowSVG` no código atual. Isso não substitui a atualização. |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | RCE em funções `use cache` retornando typed arrays. Não foram encontradas funções `use cache` no código atual. |

Os três advisories indicam 16.4.1 como versão corrigida. Aplicado patch mínimo no checkout: `next` e `eslint-config-next` de 16.4.0 para **16.4.1**, ambos fixados; lockfile atualizado. `sharp` instalado: 0.35.5. Sem mudança de versão de React, lógica de acesso ou schema.

Validação após atualização: 39 testes passaram; lint, TypeScript e build passaram. Nova consulta de todos os pacotes do lockfile ao endpoint oficial do npm não retornou advisory de Next.js. Resta um advisory moderado de desenvolvimento: [minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), em minimatch 10.2.6 na cadeia typescript-eslint → typescript-estree. Não foi executado `npm audit fix` indiscriminado.

`npm audit --omit=dev --json` após o patch: zero vulnerabilidades nas dependências de produção. Servidor de desenvolvimento reiniciado com Next.js 16.4.1 e proxy herdado.

## Preview autorizada e confirmada

Projeto `plataformarh`, equipe `contato-youconprojets-projects`. A criação por API com 35 arquivos de aplicação foi autorizada explicitamente pela pessoa, sem `.env`, histórico Git, dados pessoais ou migrações. A documentação oficial da [API Vercel](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment) confirma que omitir target cria Preview e que target null na resposta identifica esse ambiente.

Implantação inicial `dpl_9mEGRv7rnbpJadBrpcRpvW84t4ut`, READY:
https://plataformarh-mlshnwglz-contato-youconprojets-projects.vercel.app/login

- Download de 35 arquivos e build Next.js confirmados nos logs; package.json remoto corresponde ao patch 16.4.1 local.
- HTTP autenticado pela integração oficial: `/login` responde 200, título Acesso | YouCon People, formulário habilitado. `/home` sem sessão People retorna a tela de login.
- Cache privado/no-store e noindex confirmados; SSO Vercel mantido. Não compartilhar tokens ou links temporários de leitura.
- A própria pessoa confirmou login e navegação à organização/Diretoria por imagens. Não foram recolhidas credenciais. Renovação, logout real, demais papéis e múltiplas organizações ainda exigem homologação.
- Duas variáveis públicas Supabase apenas em Preview. Esse backend é o projeto ativo compartilhado; não é homologação isolada.

## Consolidação da configuração

O deployment Git anterior falhou com STATIC_BUILD_NO_OUT_DIR por saída estática public. O projeto foi corrigido para framework nextjs, install npm ci, build npm run build, rootDirectory null e outputDirectory null; Node 24.x mantido. Leitura posterior confirmou framework nextjs, domínios, SSO e Preview anteriores preservados.

`vercel.json` versiona a configuração de framework/build/install/saída para os próximos deployments. Push da feature branch pode iniciar Preview automática; não implica promoção a produção. A implantação histórica da main (somente README) não foi alterada. Nenhuma mudança de Supabase nesta consolidação.

Estado de retomada em CONTINUE.md e proposta de ambiente separado em HOMOLOGATION.md. Patch e evidências estão sendo consolidados na feature branch, sem merge. Caches, dependências, builds e arquivos de ambiente reais ficam fora do commit.
