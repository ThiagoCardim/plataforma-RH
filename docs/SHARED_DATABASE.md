# Plano revisável — convivência no Supabase compartilhado

Esta adaptação está preparada em código; **nenhuma escrita ou configuração remota foi executada**. A inspeção anterior identificou uma tabela `public.profiles`, uso do schema `private` e um gatilho de criação de perfil em `auth.users`. Não reutilizamos essas estruturas. Este documento não reproduz dados nem definições de terceiros.

## Alterações propostas

| Objeto                  | Resultado                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `youcon_people`         | Novo schema de dados, sete tabelas próprias com RLS                                                                                                |
| `youcon_people_private` | Novo schema auxiliar, não exposto pela Data API                                                                                                    |
| Tabelas                 | organizations, profiles, memberships, roles, permissions, role_permissions, membership_roles                                                       |
| Catálogos               | Quatro papéis, três permissões e oito concessões; nenhum usuário, organização ou pessoa de exemplo                                                 |
| Função auxiliar         | `youcon_people_private.has_permission(uuid,text)`, SECURITY INVOKER, search_path vazio                                                             |
| Grants                  | authenticated: USAGE e SELECT sujeitos à RLS; anon: nenhum acesso; service_role: administração das tabelas próprias, sem chave privilegiada no app |
| Aplicação               | Consultas no schema exclusivo; cookies SSR/browser/proxy exclusivos; logout de sessão local                                                        |

Toda policy, índice, FK, grant/revoke e comentário da migração pertence aos objetos novos. Não há comandos de modificação sobre `public`, `private`, `auth`, `storage`, cron, realtime, extensões, roles globais, privilégios padrão globais, usuários ou migrações de terceiros. O SQL não cria FK para tabelas existentes: memberships referencia profiles **dentro de People**. A migração não instala gatilhos de Auth, não provisiona contas e não atribui People a usuários automaticamente.

## Colisões e atomicidade

A migração recusa a existência de qualquer um dos dois schemas antes de criar objetos. Não usa IF NOT EXISTS ou CREATE OR REPLACE para assumir estruturas alheias. Transação única com `lock_timeout` local de 3 s e `statement_timeout` local de 30 s. Erros intermediários devem reverter toda a transação; testes verificam rollback inclusive após criação parcial. Uma segunda execução é recusada, não uma atualização silenciosa.

O SQL remove grants herdados de PUBLIC/anon/authenticated/service_role somente nos novos schemas/tabelas/função e concede o mínimo necessário. Privilégios padrão globais existentes permanecem intactos. Testes simulam defaults globais permissivos para demonstrar esse comportamento. Se defaults globais concederem privilégios nos objetos novos a outras roles de aplicação, uma verificação final aborta e reverte a migração para revisão, sem tocar nesses defaults. Esse caso também tem teste próprio. Outras roles administrativas/superusuários do mesmo banco continuam tendo seus poderes existentes; schemas não isolam administradores do projeto.

## Autenticação compartilhada

Não mudar signup, login anônimo, políticas de senha, Site URL, redirecionamentos, provedores, SMTP ou chaves globais. O controle de entrada na People está no vínculo ativo e nos papéis próprios, mesmo que outro app permita cadastro. Catálogos People também só são visíveis para membros ativos. Dados de `public.profiles` ou papéis de outros apps não autorizam acesso.

O cookie/storage key próprio evita reutilização acidental do armazenamento padrão Supabase no mesmo hostname. Logout `scope: local` encerra a sessão People atual; não solicita logout global. JWTs já emitidos não são instantaneamente invalidados: seguem as garantias e a expiração configuradas no Auth compartilhado. Revogar papel/vínculo People afeta novas consultas ao banco sem alterar tokens ou sessões de outros apps.

A People não cria contas automaticamente. O gatilho existente em Auth pode afetar `public.profiles` quando qualquer usuário é criado: revisar a função e preferir vincular um usuário já existente. Ausência de FK para Auth evita modificar dependências/gatilhos existentes, mas exige validação administrativa do UUID e revisão de vínculos na exclusão de conta. Essa escolha é intencional; não executar limpeza automática em tabelas compartilhadas.

## Etapas ainda não executadas

1. Revisão da migração específica e confirmação de backup recuperável.
2. Aprovação do usuário para eventual aplicação remota, separada desta preparação.
3. Execução somente do SQL aprovado, sem sincronizar/resetar o histórico global de migrações.
4. Revisão e inclusão aditiva do schema `youcon_people` na Data API, preservando a lista atual. Não expor o schema auxiliar.
5. Provisionamento aprovado somente dos registros People, com identidade Auth validada.
6. Configuração de URL/chave publishable e validação com Auth/Data API reais e sessões dos apps existentes.

Testes sintéticos não garantem ausência de impacto em todos os aplicativos ativos. O plano preserva estruturas existentes e reduz o acoplamento; a validação em ambiente de teste continua necessária antes do rollout. Nenhum módulo da Etapa 02 foi implementado.
