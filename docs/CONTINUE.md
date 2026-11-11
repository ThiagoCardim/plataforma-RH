# Continuidade em novo ambiente Codex

Usar o ambiente publicado com o domínio HTTPS `ewdgraxksonxtrylxpbd.supabase.co` permitido e recuperar a branch remota `feat/youcon-people-foundation` do repositório `ThiagoCardim/plataforma-RH`. Não começar pela main: a fundação está em revisão no PR #1, sem merge.

## Estado confirmado

- Fundação Next.js/Supabase pronta; adaptação isolada em `youcon_people` e `youcon_people_private`.
- Migração já aplicada no projeto autorizado. Registro, versão e verificações em `MIGRATION_APPLIED.md`. Não reaplicar ou resetar o banco compartilhado.
- Primeiro acesso existente foi vinculado à organização YouCon com contrato PJ e papel director. Não criar outra conta Auth nem duplicar o provisionamento. Identificar o vínculo existente somente se necessário, com consultas restritas e sem copiar dados pessoais ao repositório.
- Usuário informou ter acrescentado `youcon_people` aos schemas expostos. Ainda falta confirmar por HTTP. O schema auxiliar deve permanecer fora da Data API.
- 39 testes, lint, TypeScript e build passaram na adaptação. Depois da aplicação, 39 testes foram repetidos; RLS e integridade dos metadados/histórico legado foram verificados remotamente.
- Nesta conversa antiga, a rede permaneceu com a política anterior (sem o host permitido) e os testes HTTP foram bloqueados pelo proxy com 403. Isso não comprova falha do Supabase nem erro da configuração publicada.

## Próximo trabalho

1. Conferir environment_status no novo ambiente: confirmar a regra de rede aplicada, com a instância correta.
2. Recuperar a branch indicada e instalar dependências pelo lockfile, se necessário.
3. Recriar `.env.local` no novo checkout usando URL do projeto autorizado e chave publishable ativa, obtida pela integração Supabase sem exibi-la. Esse arquivo é ignorado e não é enviado ao GitHub.
4. Fazer uma nova conexão HTTP pelo proxy herdado. Não contornar política de rede. Com Accept-Profile `youcon_people`, distinguir recusa de acesso anônimo (esperada) de schema não exposto (PGRST106). Testar que `youcon_people_private` não está exposto.
5. Iniciar servidor de desenvolvimento e verificar preview/browser disponíveis seguindo os skills atuais do ambiente. Não orientar abrir o localhost cloud diretamente no computador do usuário.
6. Validar login com a própria pessoa no navegador, sem pedir senha no chat, sem alterar sua senha nem as sessões dos outros aplicativos. O logout People usa scope local.

## Limites

Não alterar configurações globais de Auth, tabelas/dados legados, provedores, chaves, gatilhos existentes ou demais schemas expostos. Não avançar para Etapa 02, fazer merge ou publicar aplicação em produção. Atualizar o estado técnico com evidências e explicar limitações específicas, sem inventar controles da interface.
