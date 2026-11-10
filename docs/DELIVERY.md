# Entrega — adaptação ao Supabase compartilhado

## Status

**Atualização:** após a preparação, o usuário autorizou e a migração específica foi aplicada. O relato abaixo documenta a etapa original de preparação; o estado atual, a versão remota e as verificações estão em [MIGRATION_APPLIED.md](MIGRATION_APPLIED.md). API/Auth e primeiro acesso continuam pendentes.

Preparação concluída em código na branch `feat/youcon-people-shared-database`, baseada na fundação do PR #1. **Nenhuma escrita, migração, provisionamento, alteração de Auth/Data API ou configuração foi executada no Supabase remoto.** A aplicação não foi conectada ao banco ativo. Nenhum merge, publicação em produção ou módulo da Etapa 02 foi realizado.

## O que mudou

- Sete tabelas próprias e a função auxiliar passam a pertencer a `youcon_people` e `youcon_people_private`.
- A migração original incompatível com banco compartilhado está em `docs/history/20261013150520_foundation.sql.txt`, fora da pasta executável.
- Nova migração transacional: `supabase/migrations/20261110203914_youcon_people_shared_database_foundation.sql`. Recusa schemas existentes, reverte em falhas e verifica privilégios herdados inesperados. Grants/revokes e RLS afetam somente objetos novos. Apenas catálogos de papéis/permissões são inseridos, sem pessoas ou organizações.
- Não há FK, dependência ou novo gatilho em tabelas compartilhadas de Auth. UUIDs são validados administrativamente; perfis/vínculos são próprios. Não há sincronização de perfis legados ou inscrição automática de usuários.
- Clientes SSR/browser/proxy fixam o schema People, com cookie/storage key `youcon-people-auth`. Logout com `scope: local` evita pedido de revogação de todas as sessões do usuário.
- Configuração Supabase local inclui o schema próprio e desativa seeds inexistentes. Ela não deve ser enviada ao projeto remoto.
- Procedimento de revisão, backup, aprovação e conexão futura em [SHARED_DATABASE.md](SHARED_DATABASE.md) e [SETUP.md](SETUP.md). Inventário em [FILES.md](FILES.md).

## Verificações finais executadas

| Verificação                     | Resultado                       |
| ------------------------------- | ------------------------------- |
| `npm ci` com lockfile existente | Passou                          |
| `npm run lint`                  | Passou, sem avisos              |
| `npm run typecheck`             | Passou, incluindo next typegen  |
| `npm test`                      | Passou, 39 testes em 6 arquivos |
| `npm run build`                 | Passou, Next.js/Webpack         |
| `git diff --check`              | Passou                          |

Os testes de PostgreSQL executam somente em PGlite com fixtures sintéticas. Verificam isolamento de organizações/papéis, revogação, RLS, grants de escrita, conservação de metadados/dados/permissões/defaults/gatilhos legados, colisões de schema, rollback após erro intermediário e recusa de concessões inesperadas herdadas. Verificam também que usuários Auth de outro app não são inscritos na People e que o gatilho sintético legado continua operando.

Testes dos clientes usam o SDK real com fetch interceptado para conferir Accept-Profile `youcon_people`; validam as opções de cookies em SSR/browser/proxy e o logout local. Não executam requisições no projeto compartilhado. Nenhum dado real foi importado ou incluído no repositório.

## Limites e pendências

- O changelog Supabase via HTTP foi bloqueado pelo proxy (403). O mecanismo de schemas e sua exposição foram conferidos na documentação atual via `search_docs`; assinaturas do SDK foram verificadas na versão instalada.
- Não foi feita nova inspeção ou execução no Supabase remoto nesta preparação. A função do gatilho real de Auth ainda precisa ser revisada antes de qualquer criação de conta; o teste usa uma função sintética, não uma cópia da implementação existente.
- A migração precisa de revisão e aprovação antes da aplicação específica. Confirmar backup recuperável e o alvo, sem executar sincronização geral de migrações/configurações de outros projetos.
- A inclusão aditiva de `youcon_people` na lista atual de schemas expostos da Data API é uma configuração separada, ainda não realizada. Preservar todas as entradas existentes e não expor `youcon_people_private`.
- URL/chave publishable, provisionamento aprovado e validação de Auth/Data API/advisors reais continuam pendentes. Preservar signup, provedores, chaves, URLs e demais configurações globais de Auth.
- Não houve teste visual de interface nesta adaptação de banco/cliente; nenhuma tela foi alterada. O build e os testes de sessão/consultas não substituem a validação ponta a ponta com identidade real após aprovação.
