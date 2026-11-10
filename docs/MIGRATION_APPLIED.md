# Migração People aplicada com autorização

## Escopo executado

Projeto autorizado pelo usuário: `ewdgraxksonxtrylxpbd`.
Migração: `youcon_people_shared_database_foundation`.
Versão registrada pelo Supabase: `20261110203914`.
Execução em 10/11/2026, às 17:39 no horário de Brasília (20:39 UTC).

Apenas o SQL revisado foi aplicado por `apply_migration`, sem sincronização de outras migrações. O arquivo local foi renomeado para corresponder à versão/nome atribuídos pela ferramenta: `supabase/migrations/20261110203914_youcon_people_shared_database_foundation.sql`. Seu conteúdo foi mantido integralmente, inclusive os comentários históricos da preparação. SHA-256: `090b9b6645d6f0d50a3c51b5eada3bfccfabe615ee12abb0ebb32ed3f88ae327`. Não reaplicar o arquivo; o guard rejeita schemas existentes.

## Verificações

- Projeto ACTIVE_HEALTHY e namespaces livres no preflight.
- 39 testes locais passaram novamente antes da execução.
- Ferramenta confirmou sucesso da migração.
- Sete tabelas People, todas com RLS e políticas SELECT; authenticated sem INSERT/UPDATE/DELETE/TRUNCATE; anon sem USAGE no schema.
- Quatro papéis, três permissões, oito concessões inseridas somente em catálogos People.
- Zero organizações, perfis, vínculos e atribuições de papéis provisionados.
- Função auxiliar SECURITY INVOKER, sem modificação do gatilho existente de Auth.
- Comparação por fingerprint dos schemas public/private/auth, ACLs, tabelas, políticas, gatilhos, funções e privilégios padrão: idêntica antes/depois (`5d8f093f8bfb2cf3fdc3c52c4630527d`). Isso verifica metadados, não uma comparação de todas as linhas dos aplicativos ativos.
- 182 registros de migrações preexistentes com fingerprint idêntica (`6fd3b4f51039bee895711c6c7eb5c622`); somente o novo registro People foi acrescentado.
- Teste remoto somente de leitura, como authenticated sem identidade: zero perfis/vínculos/catálogos visíveis e permissões home/gerencial negadas.
- Advisors de segurança: nenhum aviso identificado como relacionado aos schemas People. Avisos de outros objetos não foram corrigidos nem alterados neste escopo; isso não certifica todo o projeto compartilhado.

## Ainda não realizado

Nenhuma alteração em configurações de Auth, Data API, usuários, chaves, provedores, URLs ou Storage. Nenhum merge, deploy ou publicação em produção. Nenhum módulo da Etapa 02.

A aplicação ainda não está conectada funcionalmente. Faltam a inclusão aditiva do schema People na lista atual da Data API, URL/chave publishable no ambiente e provisionamento aprovado de uma identidade existente. Essas etapas exigem seu próprio escopo de autorização, preservando as configurações dos outros projetos. A validação ponta a ponta de login ocorrerá depois dessas configurações.
