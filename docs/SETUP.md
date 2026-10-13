# Configuração externa

## Supabase

1. Criar ou escolher um projeto de desenvolvimento autorizado. Nenhum projeto remoto foi criado ou alterado nesta entrega.
2. Em Auth, desabilitar cadastro público e login anônimo. `supabase/config.toml` já desabilita ambos no ambiente local; **isso não altera o projeto remoto automaticamente**.
3. Copiar a URL HTTPS do projeto e a chave **publishable** para `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Aplicar `supabase/migrations/20261013150520_foundation.sql` em banco vazio de desenvolvimento, usando SQL Editor ou CLI. Usar Supabase CLI 2.81.3 ou superior, descobrindo as opções com `--help`. Não aplicar em produção sem revisão. Exemplo de fluxo com CLI instalada: `supabase link --project-ref <ref>` e `supabase db push`; conferir o alvo antes de executar.
5. Verificar grants, RLS e advisors de segurança no projeto. Expor apenas `public` na Data API; manter `private` fora dos schemas expostos.
6. Provisionar os usuários via Auth Admin/operador autorizado, com e-mail confirmado e credencial inicial entregue por canal seguro. Não há fluxo de convite por link, criação de senha ou recuperação dentro da aplicação nesta etapa; o operador deve usar criação administrativa de usuário com senha. Não compartilhar senha em arquivos ou Git.
7. Criar organização, perfil mínimo, vínculo e papéis com SQL administrativo controlado. Os identificadores são os UUIDs reais do ambiente; não usar fixtures de testes. Exemplo **parametrizado**, para execução por ferramenta administrativa que vincule parâmetros (não colar literalmente no SQL Editor):

```sql
begin;
insert into public.organizations(id,name,slug) values ($1,$2,$3);
insert into public.profiles(user_id,display_name) values ($4,$5);
insert into public.memberships(id,organization_id,user_id,contract_type)
values ($6,$1,$4,$7);
insert into public.membership_roles(membership_id,user_id,role_code)
values ($6,$4,$8);
commit;
```

`$7` é clt/intern/pj; `$8` é professional/leadership/hr/director. Um operador autorizado escolhe esses valores, nunca o usuário final. Para usuários adicionais, reutilizar a organização existente e omitir sua inserção. Para acumular papel, inserir outra linha em membership_roles no mesmo vínculo. Para revogar, definir `memberships.active=false` ou remover o papel. A ausência de vínculo/papel não concede acesso.

8. Configurar Site URL e URLs de retorno do Auth para os ambientes autorizados, mesmo que o login por senha desta etapa não use callback. Ajustar políticas de senha e rate limiting no Supabase. A aplicação repassa credenciais diretamente ao Auth e exibe erros genéricos para reduzir enumeração de contas.
9. Depois de aplicar a migração, gerar tipos atualizados com `supabase gen types typescript --help` e o alvo apropriado, substituindo `src/lib/supabase/types.ts`. Os tipos iniciais são o contrato manual das tabelas e não cobrem operações futuras.
10. Verificar login/logout, renovação de sessão, perfis, acesso direto por URL, alteração de organização e revogação com usuários de teste. A Home só aparece com identidade Auth válida, vínculo ativo e permissão home.view.

Para Supabase local com Docker: instalar CLI, executar `supabase start` e `supabase db reset`; signup já está desabilitado. Usar as chaves publishable fornecidas pelo ambiente local. Não há seeds de pessoas. Não iniciar Docker nesta entrega foi uma escolha de validação local com PGlite, que não depende de contêineres.

## GitHub e Vercel

Branch de trabalho: `feat/youcon-people-foundation`. Revisar o PR antes de integrar à main. Nenhuma ação de merge ou publicação foi configurada.

A aplicação usa convenções padrão do Next.js e pode ser importada na Vercel. Selecionar Node.js 22+, framework Next.js e build `npm run build`; incluir as duas variáveis do Supabase no ambiente de preview. Não é necessário vercel.json. Não importar/publicar automaticamente nem apontar previews para dados de produção.

Storage não foi configurado: não existem uploads na etapa 01. A identidade visual oficial ainda deve ser fornecida.
