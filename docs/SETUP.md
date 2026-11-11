# Configuração para banco compartilhado

**Status: a migração específica foi aplicada após autorização do usuário.** Data API e conexão da aplicação foram configuradas posteriormente, e o primeiro acesso existente já foi vinculado. Login inicial confirmado pela pessoa na Preview. Não repetir essas operações. Estado atual em [CONTINUE.md](CONTINUE.md); homologação separada ainda é proposta em [HOMOLOGATION.md](HOMOLOGATION.md). Consulte [MIGRATION_APPLIED.md](MIGRATION_APPLIED.md) para o registro da execução. As etapas de revisão abaixo documentam o procedimento; não executar novamente a migração.

## Revisar antes de qualquer aplicação

1. Revisar [SHARED_DATABASE.md](SHARED_DATABASE.md) e `supabase/migrations/20261110203914_youcon_people_shared_database_foundation.sql`. A migração cria exclusivamente `youcon_people` e `youcon_people_private`. Se algum desses schemas existir, ela interrompe e reverte a transação, em vez de reutilizá-lo. Privilégios herdados inesperados de outras roles também provocam aborto, sem alteração dos defaults compartilhados.
2. A migração antiga de banco vazio está arquivada em `docs/history/20261013150520_foundation.sql.txt`, fora da cadeia executável. **Não executá-la.** Se ela já foi aplicada em outro ambiente, não apagar ou reescrever o histórico desse ambiente: preparar um plano próprio de transição. Esta nova base destina-se a ambientes ainda não provisionados para People.
3. Confirmar backup recuperável do projeto compartilhado e validar primeiro em banco descartável de teste. `npm test` executa os testes locais em PostgreSQL PGlite, sem credenciais ou conexão remota e sem copiar dados reais.
4. Um operador pode revisar o SQL de catálogo somente de leitura em `supabase/review/preflight.sql`: ocupação de schemas, privilégios padrão e gatilhos em Auth. Nenhum gatilho existente é alterado pela migração. Antes de criar qualquer conta, revisar a função do gatilho com o responsável pelos aplicativos existentes.
5. Não executar `supabase db reset`, `supabase db push`, `supabase config push` ou sincronizações automáticas contra o projeto compartilhado. Ele contém histórico de outros projetos. A aplicação futura deve executar **somente o SQL específico aprovado**, por operador autorizado, com o alvo confirmado, sem reset, limpeza ou reconciliação de migrações de terceiros. Aguardar aprovação explícita antes de qualquer escrita remota.

## Procedimento de referência — configuração inicial já concluída no ativo

1. Na Data API, **acrescentar** `youcon_people` à lista atual de schemas expostos, preservando todas as entradas existentes. Isso é uma configuração compartilhada e exige revisão própria: a migração não a modifica. Nunca expor `youcon_people_private`; não mudar o search_path global. Os grants mínimos já estão no SQL; não aplicar o exemplo genérico de GRANT ALL para anon da documentação.
2. Preservar configurações globais de Auth: cadastro público, login anônimo, provedores, URLs, templates, SMTP, rate limits, política de senha e chaves/JWT. O login por senha desta etapa não necessita mudar a Site URL nem adicionar callback. A aplicação não oferece cadastro e um usuário Auth sem vínculo/papel People não recebe acesso, mesmo se o cadastro global estiver habilitado.
3. Preferir uma identidade Auth **já existente e autorizada**, sem mudar sua senha, e-mail, metadados ou sessões de outros aplicativos. Não sincronizar nem importar `public.profiles`, usuários ou permissões de outros projetos. Criação de usuário novo pode acionar gatilhos compartilhados: somente após revisão específica desses efeitos. Não alterar, remover ou desabilitar o gatilho existente para contorná-los.
4. Um operador verifica o UUID no Auth e provisiona apenas nas tabelas People. Não há FK em `auth.users`, evitando novos gatilhos ou dependências nas tabelas existentes; os UUIDs precisam ser validados no provisionamento. Exemplo parametrizado para ferramenta administrativa que vincule parâmetros, **não para colar literalmente no SQL Editor**:

```sql
begin;
insert into youcon_people.organizations(id,name,slug) values ($1,$2,$3);
-- Read Auth identity only; never insert/update/delete auth.users here.
insert into youcon_people.profiles(user_id,display_name)
select id,$5 from auth.users where id=$4;
insert into youcon_people.memberships(id,organization_id,user_id,contract_type)
values ($6,$1,$4,$7);
insert into youcon_people.membership_roles(membership_id,user_id,role_code)
values ($6,$4,$8);
commit;
```

Se `$4` não existir no Auth, a inserção do vínculo falha por FK para o perfil People e toda a transação deve ser revertida. `$7`: clt/intern/pj. `$8`: professional/leadership/hr/director. Escolhas aprovadas por operador confiável; não aceitar papel vindo do usuário final. Para organização já criada, omitir sua inserção e reutilizar seu UUID. Atribuições não são automáticas. Na exclusão de uma identidade Auth, desativar seus vínculos People antes e revisar a limpeza posterior apenas dos dados People; não há cascata automática a partir de Auth.

5. Configurar `.env.local`, nunca versionado:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto autorizado.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publishable desse mesmo projeto.
     Não usar `service_role`, secret ou senha de banco no navegador. Não rotacionar chaves compartilhadas para conectar esta aplicação. A URL informada pelo usuário identifica o alvo, mas não configura o aplicativo por si só.
6. A aplicação fixa `db.schema = youcon_people`; não há fallback para `public`. SSR, navegador e proxy compartilham o armazenamento de sessão `youcon-people-auth`, sem `Domain` compartilhado. Cada implantação deve preferir hostname próprio. O logout usa `scope: local`, não revoga todas as sessões do usuário. A identidade Auth continua compartilhada; isso não transforma o Auth em um provedor independente por aplicativo.
7. Regenerar os tipos apenas para `youcon_people`, com CLI instalada e opções conferidas em `supabase gen types typescript --help`. O contrato inicial em `src/lib/supabase/types.ts` cobre somente esse schema. Não incluir tipos de tabelas de terceiros no repositório People.
8. Validar em ambiente autorizado com tokens reais: login/logout, renovação de cookies, isolamento de organizações, bloqueio de liderança, usuário Auth sem vínculo, revogação e ausência de efeito nas sessões dos outros apps. Conferir advisors e concessões apenas dos novos objetos; não corrigir objetos de terceiros neste escopo.

## Execução local e implantação

`npm ci`, `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. O `supabase/config.toml` serve **somente para um Supabase local descartável**: inclui o schema People na API local e mantém signup local desabilitado. Não enviar essa configuração ao remoto. Não há seeds de pessoas ou organizações.

No seu computador, a aplicação local responde na porta 3000. No Codex cloud, depende de prévia/encaminhamento disponibilizado pelo ambiente; o localhost da nuvem não é acessível diretamente pelo navegador do seu computador.

Preview protegida já disponível e conectada ao projeto autorizado; não houve publicação da aplicação People em produção. A configuração Next.js está no projeto Vercel e em vercel.json, sem saída estática personalizada. Não usar o banco ativo para fixtures ou novas escritas de teste; seguir a proposta HOMOLOGATION.md após aprovação. Storage permanece sem uso.
