# feat: isolar a YouCon People no Supabase compartilhado

A migração original criava objetos em public/private, incluindo um nome já existente (`public.profiles`). Esta adaptação cria apenas `youcon_people` e `youcon_people_private`, fixa as consultas da aplicação no schema próprio e recusa a execução caso qualquer namespace já exista. A migração antiga foi arquivada fora da cadeia executável; não existe transferência ou exclusão de dados legados.

O SQL é transacional, usa timeouts locais e só administra grants, RLS, funções e FKs dos novos objetos. Não cria dependências/FKs/gatilhos em auth.users nem altera configurações de Auth, exposição da API, privilégios padrão globais, tabelas existentes ou histórico de migrações de terceiros. A identidade Auth é validada no provisionamento administrativo; nenhum usuário é criado ou inscrito automaticamente.

SSR, browser e proxy usam armazenamento de sessão exclusivo da People, e o logout usa scope local. Um usuário autenticado por outro aplicativo precisa de vínculo/papéis People para obter acesso. A documentação remove orientações de desabilitar signup global ou sincronizar configurações no projeto compartilhado.

Validar com lint, tipos, testes SQL/RLS/PGlite e build. Os testes de convivência usam somente fixtures sintéticas e conferem dados/metadados legados, grants herdados, gatilho existente, transação e colisões. Clientes são testados com HTTP interceptado para verificar o schema usado pelo SDK e o logout local.

Escopo: preparação e revisão, sem execução de SQL remoto, configuração de Supabase/Vercel, merge ou produção. Não inclui Etapa 02. Revisar docs/SHARED_DATABASE.md, docs/SETUP.md e docs/DELIVERY.md. Branch local: feat/youcon-people-shared-database, baseada na fundação já submetida no PR #1.
