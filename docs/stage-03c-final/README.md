# Etapa 03C — especificação final para revisão de segurança

Data: 13/11/2026. Base documental a5aa005, contendo integralmente a interface aprovada 6adeaa6. Esta pasta substitui, para avaliação técnica, o SQL estrutural preliminar da 03C.1 e seus gates ainda sem implementação. Não substitui as decisões D01–D15. Nenhum arquivo desta pasta pertence a supabase/migrations; os lotes .sql.txt foram executados SOMENTE em PostgreSQL descartável local.

**Não há autorização de implantação remota.** Esta entrega prepara uma revisão final, não declara o projeto compartilhado homologado. Não foram feitas chamadas ao banco remoto nesta rodada. Foram consultadas orientações de funções/RLS pela busca documental Supabase; a tentativa de baixar o índice changelog foi bloqueada pela rede (403). Não foram instaladas extensões, alterados Auth ou objetos reais de outra aplicação, criadas contas, feitas merges ou publicada produção.

## Arquivos e ordem

| Arquivo | Conteúdo exato |
| --- | --- |
| 00-executor.sql.txt | Papel técnico novo, sem login, superusuário, bypass de RLS, herança ou administração de roles; somente USAGE nos namespaces necessários e EXECUTE auth.uid() |
| 01-estrutura.sql.txt | Tabelas novas, PK/FK/checks/índices, RLS ligada e ACL fechada; detector de grants herdados inesperados |
| 02-integridade.sql.txt | Triggers, verificações diferidas, preservação do histórico, auditoria; privilégios de dados exclusivamente ao executor e SELECT dos sete catálogos/acessos existentes |
| 03-funcoes.sql.txt | Corpos completos das funções de comando, consultas, projeções, idempotência, elegibilidade e aprovação; wrappers públicos invoker; catálogo/concessões das novas capacidades |
| 04-ativacao.sql.txt | EXECUTE das novas RPCs, SELECT por coluna com RLS e policies restritivas de elegibilidade nos sete objetos existentes |
| R1-quarentena.sql.txt | Revogação exata das RPCs/projeções e leitura das tabelas novas, sem apagar dados nem remover bloqueio por encerramento |
| R2-elegibilidade-legada.sql.txt | Backout independente das sete policies restritivas novas; restaura comportamento legado e pode readmitir vínculos encerrados, portanto exige autorização própria |
| TESTES.json | Resultado observado, versão real do PostgreSQL, nomes dos testes e SHA-256 dos lotes efetivamente testados |
| IMPLANTACAO.md | Dependências, riscos, testes, autorizações e recuperação por lote |

A estrutura preliminar anterior NÃO deve ser aplicada junto com estes arquivos. O lote 01 cria os objetos novos do zero sobre a fundação existente. Não há IF NOT EXISTS para assumir objetos desconhecidos: colisões abortam a transação. Não reaplicar a fundação histórica. Cada lote 00–04 é transacional, com lock_timeout local de 3 segundos e statement_timeout local de 30 segundos. Não há alterações de defaults globais.

## Invariantes resolvidos

- **Um vínculo vigente por pessoa/organização:** períodos contratuais inclusivos não podem se sobrepor, inclusive programados. Um contrato sem fim ocupa até infinito. Reingresso só começa depois do último dia do anterior. Não se usa CURRENT_DATE em índice nem coluna active como substituto de vigência.
- **Prazo previsto e encerramento real distintos:** planned_end_date guarda limite pactuado; end_date registra encerramento efetivo. O período máximo usa coalesce(end_date,planned_end_date). É possível movimentar e encerrar antecipadamente um contrato com prazo. Datas previstas ficam preservadas. Não estender contrato existente ou reabrir encerrado silenciosamente; extensão/aditivo não integra esta API inicial.
- **Estados:** somente relações confirmadas são persistidas por esta API. Programado/vigente/encerrado são derivados de datas e access_closed_at. A preparação incompleta é uma pessoa sem vínculo; não há transições de rascunho/cancelamento contratual parcialmente implementadas. O encerramento imediato bloqueia People mesmo no próprio dia; para data futura, o acesso termina após o último dia inclusivo.
- **Concorrência sem extensão:** todas as escritas de integridade obtêm advisory lock transacional por organização antes de consultar referências. Hash colisivo apenas serializa organizações adicionais. As RPCs e os triggers rejeitam isolamento diferente de READ COMMITTED; em snapshots antigos a espera pelo lock não garantiria enxergar uma gravação concorrente. A escolha conservadora reduz paralelismo por organização e precisa de medição de carga antes da ativação, mas mantém o modelo simples para esta etapa.
- **Movimentações:** intervalos [início,fim), primeira alocação no início do contrato, última até seu término efetivo/previsto. Só a última alocação pode ter seu fim reduzido; versões com sucessor ou vínculo encerrado são imutáveis. Uma FK composta mantém supersedes_id na mesma organização e vínculo; predecessor deve terminar exatamente na data inicial do sucessor e só admite um sucessor. Movimentações são posteriores à última vigência e não futuras nesta API; retrocorreções e agendamento de movimentação ficam fora do conjunto autorizado de operações.
- **Liderança e supervisão:** vínculos responsáveis devem pertencer à mesma organização, cobrir todo o intervalo e não criar autorreferência/ciclo no período. A busca recursiva carrega a interseção temporal ao longo do caminho. Encerrar o responsável é recusado enquanto deixar alocações ou estágios sem cobertura. Catálogos inativos não aceitam alocações novas; seu histórico ainda pode ser fechado durante uma movimentação válida.
- **Subtipos:** cada confirmado deve ter exatamente um detalhe CLT/estágio/PJ compatível ao final da transação. Alterar o tipo de um vínculo existente é proibido. Instituição/curso e dados PJ são opcionais no mínimo inicial; não há salário/benefícios CLT presumidos para PJ.
- **Pessoa/conta:** FK apenas para profile People existente e membership na organização, sem FK ou trigger de Auth. Intervalos de associação [início,fim) não podem se sobrepor para a pessoa OU para o usuário na mesma organização, nem entre registros já encerrados. Datas e instantes não aceitam valores PostgreSQL infinity; exceções e concessões sempre expiram. A confirmação operacional de identidade precede a chamada, sem usar e-mail isolado como prova. Esta API associa; desassociação e correção retroativa exigirão operações específicas, não SQL arbitrário do cliente.

## Funções transacionais completas

Todas as chamadas públicas usam nomes people_*. Os wrappers são SECURITY INVOKER; delegam a endpoints SECURITY DEFINER individuais em youcon_people_private, não exposto pela API. O dispatcher interno não tem EXECUTE para authenticated/anon/service_role. Ele recebe uma operação constante do endpoint, não aceita SQL dinâmico e aplica lista fechada de campos. `o` seleciona organização, mas não concede autorização. `k` é UUID de idempotência, `d` é o objeto JSON de dados.

| RPC | Campos de d | Resultado e validação |
| --- | --- | --- |
| people_create_person | full_name; display_name opcional | UUID/código gerado no servidor; sem Auth/profile/membership automático |
| people_edit_person | person_id, version, reason; full_name/display_name ou kind/scope/value | Edição otimista; privado exige concessão adicional. Alteração do próprio cadastro gerencial passa por pedido/revisor distinto, evitando bypass de autoaprovação |
| people_create_engagement | person_id, type, start, end previsto opcional, unit_id, department_id, position_id, leader_id opcional, detail opcional | Vínculo + detalhe correto + alocação inicial, atômicos; somente uma relação no intervalo |
| people_close_engagement | engagement_id, version, end, reason | Encerra última alocação, guarda data real e bloqueio imediato/futuro; nunca chama Auth |
| people_move_engagement | engagement_id, version, date, unit_id, department_id, position_id, leader_id opcional, reason | Fecha versão, cria sucessora e incrementa versão do vínculo |
| people_associate_account | person_id, user_id, from, to opcional | Exige capacidade operacional específica e membership/profile existentes; não cria ou atribui papéis |
| people_submit_request | person_id, version, field, value | Só própria pessoa associada. field: display_name/professional_email/professional_phone. Papel RH é atestado no servidor |
| people_review_request | request_id, approve boolean, reason | Lock do pedido e pessoa; nega autoaprovação (inclusive pela mesma pessoa após trocar de conta), decisão repetida e revisor indevido. Conflito de versão vira conflict, sem aplicar proposta |
| people_access_exception | person_id, user_id, from, to, reason | Somente concessão específica; período finito coberto pela associação e aprovador diferente do beneficiário |

Identidade e autoria vêm exclusivamente de auth.uid(), segundo a sessão verificada pelo gateway/servidor. Papel, approved_by, requester_was_hr, organization_id no payload, status e autoria forjados são recusados. A organização é revalidada em toda chamada, inclusive antes de retornar recibo de idempotência. O teste local simula as claims no fixture; isso não significa aceitar claims enviadas pelo cliente à API real.

O recibo tem chave (organização,ator,idempotency_key), operação, SHA-256 do texto canônico jsonb e resultado mínimo. Nenhum contato ou payload integral é armazenado no recibo. Repetir a mesma chave/corpo retorna o mesmo resultado; mudar o corpo é erro. Revogação posterior de acesso impede até a leitura de recibo antigo. Lock, negócio, auditoria e recibo pertencem à mesma transação. Versão ausente ou NULL não contorna concorrência otimista.

## Matriz final de permissões

| Operação | Profissional | Liderança | RH | Diretoria |
| --- | --- | --- | --- | --- |
| Listagem/ficha/histórico Base | Não | Não | Sim, organização elegível | Sim, organização elegível |
| Criar/editar outras pessoas e vínculos | Não | Não | Sim | Sim |
| Editar próprio cadastro diretamente | Não | Não | Não; pedido | Não; pedido |
| Solicitar alteração própria | Sim, campos permitidos | Sim, campos permitidos | Sim | Sim |
| Revisão comum | Não | Não | Sim, ator diferente | Não, salvo também possuir papel RH |
| Revisão excepcional de pedido feito por RH | Não | Não | Outro RH | Sim, condição RH no envio e na decisão; ator diferente |
| Contatos privados | Não pela Base | Não pela Base | Concessão nominal adicional | Concessão nominal adicional |
| Exportação gerencial | Não | Não | Concessão nominal adicional | Concessão nominal adicional |
| Associação de conta/exceção administrativa | Não | Não | Concessão nominal adicional | Concessão nominal adicional |
| Alterar papéis/conceder capacidades | Não | Não | Não por estas RPCs | Não por estas RPCs |
| Ler auditoria completa | Não | Não | Não automático | Não automático |

O catálogo existente é reutilizado: novas capacidades de cadastro/vínculo são concedidas a hr/director; pedido próprio aos quatro papéis; revisão comum a hr e excepcional a director. Para privado, exportação, associação e exceção, special_grants contém concessão nominal por organização/usuário, finalidade, aprovador e expiração, ligada à membership existente. A aplicação não tem API para conceder essas permissões. A ausência da concessão nega acesso mesmo para RH/Diretoria. Papel e capacidade são checados conjuntamente na revisão; atribuição acidental de capacidade comum à Diretoria não elimina a regra excepcional.

## RLS e privilégios mínimos

Tabelas são de propriedade do administrador, não do executor. O executor é NOLOGIN/NOBYPASSRLS e tem policies próprias explícitas e grants limitados: SELECT nos sete objetos de acesso existentes; SELECT/INSERT/UPDATE nas entidades novas necessárias, sem DELETE; em auditoria/itens imutáveis/recibos, sem UPDATE. Não recebe escrita em Auth, Storage, public/private, memberships, papéis ou configurações, nem poderes de criação de objetos depois da preparação.

O executor precisa consultar associações/contratos e papéis sem depender da RLS do usuário que chama a função; por isso tem policies de backend em objetos People. Isso NÃO equivale a um papel por organização: a barreira de organização está nas funções revisadas. Nenhum usuário pode assumir o papel. Os endpoints privilegiados têm search_path vazio e tabelas qualificadas. Funções internas e triggers não são endpoints públicos. PUBLIC/anon/service_role não recebem EXECUTE novo; privilégios herdados inesperados abortam o lote, sem modificar defaults de outro aplicativo.

Authenticated não recebe INSERT/UPDATE/DELETE em tabelas. SELECT direto é concedido por coluna apenas para o núcleo gerencial, com RLS que exige organização elegível e papel RH/Diretoria. created_by e motivos livres de movimentação não integram essas concessões. Pedidos, contatos, detalhes contratuais, associações, recibos, exceções e auditoria não recebem SELECT direto de usuário.

people_directory e people_history entregam projeções gerenciais; histórico inclui movimentos e referências anteriores, sem motivo privado. people_private_contacts exige capacidade adicional. people_my_requests só retorna pedidos do próprio ator; people_review_queue filtra solicitantes e condição RH conforme o revisor. people_export exige capacidade nominal e limita a página a 100 itens, paginada por UUID. A saída é JSON gerencial, sem contato/documento/identificador de conta; eventual codificação CSV deve neutralizar fórmulas no backend. Não se publicou view com privilégios de proprietário.

## Auditoria, histórico e privacidade

Triggers preservam eventos de escrita e a função registra a operação/correlação/motivo de negócio. O ator é derivado da sessão. UPDATE/DELETE dos eventos é recusado; o executor não tem privilégios para fazê-los. Correções de nome guardam antes/depois em protected_diff, protegido sem leitura de usuário. Contatos antigos continuam em linhas históricas; o valor não vai para o recibo nem para auditoria genérica. As versões de alocação e os vínculos anteriores preservam a trajetória. Não há garantia contra superusuário capaz de desabilitar triggers; este é um limite do administrador compartilhado, não uma propriedade resolvida por RLS.

Não são coletados CPF, saúde, biometria, dados financeiros ou anexos neste lote. Motivos livres devem excluir informações sensíveis; mesmo assim não são exportados nem expostos diretamente à Diretoria. Retenção de nomes/contatos/pedidos/auditoria e a finalidade de coleta privada precisam de decisão RH/jurídico antes do uso real. Não foi criado purge automático sem essa decisão. A capacidade especial de privado deve permanecer sem concessões até sua aprovação.

## Revogação People e transição

A elegibilidade exige membership ativa e (associação vigente com contrato elegível OU exceção finita documentada ainda ligada à associação vigente da mesma pessoa/conta). Extensões contratuais não são papéis. Encerramento imediato deixa access_closed_at e nega acesso; término futuro/expiração de exceção são avaliados por statement_timestamp(), sem depender de cron ou de renovação de claims.

O lote 04 acrescenta policies RESTRICTIVE, exclusivas de authenticated, às sete tabelas existentes; não sobrescreve has_permission nem as policies antigas. Assim a aplicação existente perde a membership legível e as guardas reais negam acesso, mesmo sem mudar o código aprovado. Para um usuário elegível em outra organização, o perfil próprio global pode continuar legível; a membership da organização encerrada continua bloqueada. O executor evita recursão nas consultas de elegibilidade por suas policies próprias, sem bypass de RLS.

Antes de 04, cada conta administrativa existente deve ter associação válida e contrato ou exceção aprovada. A implantação não deve ativar enforcement sem essa conferência; não há fallback eterno para conta sem pessoa. Se não houver revisor elegível, o pedido permanece pendente. Nenhuma operação revoga sessão Supabase global, exclui usuário ou dispara o trigger de criação Auth de outra aplicação.

## Verificação local e limites

O teste reproduzível está em tests/postgres/run.py. Ele cria um container PostgreSQL 17.6 por digest, sem rede ou porta publicada, e usa somente socket Unix via docker exec no daemon local explicitamente selecionado. Remove apenas seu container de UUID próprio ao concluir. Não aceita URL de banco e não usa credenciais Supabase. Fundação e Auth são fixtures sintéticas locais; outra aplicação é representada por tabela/trigger sentinela.

```sh
python tests/postgres/run.py
```

O relatório TESTES.json registra os casos e hashes dos lotes. Entre eles: tipos contratuais, contratos programados, reingresso, sobreposição, associação de contas, movimentos, liderança/supervisão, autorização/RLS, privado, aprovação excepcional e proibição de autoaprovação, NULL version, rollback de negócio/auditoria/recibo, duas sessões com espera de lock comprovada em pg_stat_activity, grants herdados e os dois SQLs de recuperação. Não foram executados testes remotos ou importadas fixtures no Supabase. Os testes locais não certificam configuração PostgREST, sessões reais, versão do servidor hospedado, carga ou todos os objetos de outro aplicativo.

A interface, os testes existentes da 03B, dependências e migrations permanecem sem alterações. Não foi necessário repetir build de UI para arquivos exclusivamente documentais e testes PostgreSQL; a preservação é verificada pelo diff de src/, supabase/, package.json e lockfile contra 6adeaa6.
