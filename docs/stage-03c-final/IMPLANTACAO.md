# Implantação proposta por lotes e recuperação

Nenhum lote está autorizado para execução remota. Os arquivos de SQL ao lado são o texto exato usado no PostgreSQL local; hashes no relatório TESTES.json. Não copiar para migrations nem sincronizar com `db push` antes da aprovação específica. Não publicar a interface persistente, fazer merge ou alterar a Preview aprovada como consequência desta entrega.

## Pré-condições comuns, somente de leitura

1. Confirmar projeto compartilhado correto e responsáveis pela outra aplicação, janela e disponibilidade operacional. Manter o mesmo Supabase.
2. Confirmar versão PostgreSQL e funções nativas usadas (gen_random_uuid, sha256, advisory locks), sem instalar extensões; verificar o inventário atual versus a fundação. Rever colunas/constraints, schema ACL, defaults herdados, owners e grants de funções. Não ler registros pessoais para essa inspeção técnica.
3. Confirmar ausência de todos os nomes novos, da role youcon_people_executor e das policies people_eligibility/executor_read. Uma colisão exige análise, não IF NOT EXISTS/CREATE OR REPLACE.
4. Capturar definições e ACLs dos objetos People existentes e os metadados necessários para comparação de schemas alheios, sem copiar seus dados ou definições privadas desnecessárias. Guardar os snapshots com acesso restrito e identificação do lote.
5. Conferir checksums do SQL aprovado e que nenhuma função privilegiada ficou owned por postgres, sem search_path fixo ou com EXECUTE herdado inesperado. O papel executor não pode ser concedido a usuários, authenticated, anon, service_role ou papéis de outros aplicativos.
6. Aprovar separadamente qualquer associação de conta, exceção e capacidade nominal. O mapeamento real não é fixture ou seed e não foi produzido com dados reais nesta entrega. A ligação usa profile/membership existentes; exige confirmação confiável da identidade fora do cadastro. Não criar Auth como parte do rollout.

## Lotes 00–04

| Lote / SQL exato | Objetos afetados e dependências | Verificação antes e depois | Risco, recuperação e autorização necessária |
| --- | --- | --- | --- |
| 00 / 00-executor.sql.txt | Cria role técnica; grants USAGE nos dois schemas People e em auth, EXECUTE somente em auth.uid(). Não altera corpo de Auth ou usuários | Antes: nome livre, operador autorizado a criar role. Depois: NOLOGIN, NOSUPERUSER, NOBYPASSRLS, NOCREATEROLE, NOCREATEDB, NOINHERIT, sem membros | Role de banco é objeto compartilhado: autorização explícita. Em falha, transação reverte; se confirmado mas lote posterior falhar, deixar role inerte sem membro, não usar DROP OWNED global. Limpeza posterior somente com análise de dependências e revogação dos grants exatos |
| 01 / 01-estrutura.sql.txt | 18 tabelas novas People: catálogos organizacionais, pessoas/contatos, vínculos/alocações/subtipos/fornecedor, contas, pedidos/itens, exceções, auditoria, recibos e concessões nominais. Reutiliza organizations/profiles/memberships. Nenhum FK novo para Auth | Antes: fonte de verdade e nomes novos livres; budgets locais de lock/statement. Depois: todas com RLS, nenhuma ACL de aplicativo, constraints/FKs e índices corretos, zero concessões inesperadas herdadas. Não inserir pessoas reais | Locks de FK/catalogação sobre People; impacto de defaults do owner. Detector aborta sem mudar defaults globais. Falha transacional reverte tudo deste lote. Após commit, preservar estrutura fechada; não remover tabelas com dados para voltar versão. Autorização DDL específica |
| 02 / 02-integridade.sql.txt | Funções lock_org, guard_integrity, reject_mutation, audit_row e contract_complete; triggers apenas nas tabelas novas. Policies/grants do executor nas novas e SELECT/policy executor_read nos sete objetos de acesso atuais. contract_complete privado passa a ser owned pelo executor para rodar diferido no commit | Antes: lote 01 íntegro e teste de concorrência/ACL aprovado. Depois: períodos, subtipos, cadeia, liderança e associação válidos ao commit; cliente ainda sem escrita direta; helpers sem EXECUTE público. Auditoria não editável e não exposta | Código privilegiado e leituras backend de autorização. Necessário aprovar grants por objeto e corpo do trigger diferido. Falha reverte lote; não desligar triggers de integridade como rollback após dados. Deixar backend fechado se inconsistência for detectada |
| 03 / 03-funcoes.sql.txt | Helpers privados, nove comandos transacionais, seis projeções com wrappers invoker e endpoints privados definer. Insere somente cinco códigos novos de permissão e suas concessões em role_permissions. Não altera papéis atuais nem concede capacidades nominais especiais | Antes: revisão de todas as listas de campos, guards de ator/org, owner, search_path, recibos e auditoria. Depois: sem PUBLIC/anon/service_role nos endpoints, sem EXECUTE no dispatcher, owner restrito sem CREATE permanente; capacidades corretas, zero Auth/global writes. Diretoria não pode usar revisão comum apenas por possuir capacidade por engano | Funções definer têm acesso backend ao domínio People, não ao banco inteiro. Execução privada por authenticated é necessária à cadeia do wrapper invoker; o schema privado permanece fora da Data API. Não manter CREATE concedido ao executor. Detector de ACL herdada aborta atomicamente. Autorização específica para funções e catálogo. Se ativação posterior falhar, aplicar R1 para fechar endpoints; preservar dados |
| 04 / 04-ativacao.sql.txt | EXECUTE dos wrappers públicos; SELECT por coluna das seis tabelas básicas; policies manager_read nas novas e people_eligibility RESTRICTIVE nas sete tabelas atuais. Não sobrescreve funções/policies antigas | Antes: mapear TODAS as contas administrativas existentes para pessoa/contrato ou exceção finita validada; confirmar uma rota operacional de recuperação People. Validar sessão real e Data API com usuários autorizados, sem inserir fixtures remotas. Depois: testar papel/org/campos, queries diretas, expiração, encerramento imediato/futuro, catálogo/rotas/guards e sessões de outra aplicação preservadas | Maior risco: bloqueio de administrador ou revogação incompleta. Ativação exige aprovação própria do mapa de acesso e regras de exceção. R1 fecha dados/API novos e mantém bloqueio de encerrados. R2 só mediante autorização explícita, pois volta à elegibilidade legada e pode readmitir quem foi encerrado |

A criação do papel e os grants mínimos sobre auth.uid/schema auth são exclusivamente para ler a identidade já autenticada, não para criar/editar usuários ou sessões. São privilégios de banco compartilhado e constam do lote para aprovação explícita. Se a política operacional do projeto não permitir esse owner, interromper e revisar o desenho; não substituir silenciosamente por postgres/service_role.

## Integração da aplicação, depois dos lotes autorizados

A interface 03B permanece demonstrativa nesta entrega. Preparar PR separado para adaptador real que use RPCs com a sessão do usuário e seleção de organização validada, nunca service_role no cliente. Consultas devem pedir somente as colunas concedidas; SELECT * deliberadamente não é o contrato das tabelas gerenciais. Usar paginação, controle de versão, UUID de idempotência e erros de conflito sem mostrar SQL ou informações privadas.

A ativação de banco não autoriza a aplicação a alternar silenciosamente entre dados reais e fictícios. O modo deve ser explícito; em falha de integração real, mostrar erro/indisponibilidade, não um diretório fictício que pareça oficial. Desenvolver testes de API/SDK e do fluxo autenticado hospedado depois da autorização pertinente. O SQL local valida PostgreSQL e privilégios, não configura automaticamente exposição API ou cache de schema PostgREST. Preservar a lista existente de schemas expostos; nunca expor youcon_people_private.

## Testes e critérios de aceite

Os testes locais usam os arquivos exatos 00–04 e R1/R2, imagem fixada por digest e dados inventados. TESTES.json enumera os casos observados. Os critérios para futuro rollout não se limitam a “SQL executou”:

- Serialização comprovada por espera de lock entre duas sessões; um contrato ganha e outro sobreposto falha. Mesma chave/corpo gera exatamente um vínculo/recibo e mesmo resultado.
- Personagem sem conta é válido; organização no argumento nunca autoriza acesso; perfil/conta de outra organização não é aceito. Profissional/Liderança não lê Base por RLS nem por RPC.
- Associações históricas, períodos inclusivos de contrato e exclusivos de alocação/conta, endpoints previstos e encerramento real continuam coerentes sob concorrência.
- Autoaprovação e edição própria que a contorne são negadas; revisão excepcional exige RH no envio e na decisão; mudança concorrente de versão deixa cadastro intacto e pedido em conflict.
- Um erro após escrita cadastral reverte cadastro, auditoria e recibo; auditoria não é editável por nenhum endpoint; nomes corrigidos têm evidência protegida e contatos não vazam em recibo/projeção.
- Nenhum grant imprevisto herdado sobre objetos novos sobrevive ao lote. Não tentar “corrigir” os defaults do outro aplicativo.
- Após revogação ou expiração, novas queries/operações People são negadas sem esperar JWT novo ou job. Em conta com outra organização elegível, bloquear apenas a organização encerrada. Auth e sessões de outros aplicativos não são revogados.
- Conferência posterior de metadados compartilhados deve diferenciar os grants explicitamente autorizados do lote e qualquer alteração fora do escopo. Se houver diferença inesperada, interromper; não reparar objetos de terceiros.

## Limite transacional da revogação

A revogação vale para novas consultas/operações após o commit; não cancela respostas ou transações já iniciadas sob um snapshot anterior. Todas as RPCs de negócio deste pacote compartilham o lock por organização. Alterações operacionais autorizadas de memberships, papéis ou concessões devem usar o mesmo protocolo de lock e aguardar operações em curso; não há um trigger novo imposto às tabelas legadas para interceptar SQL arbitrário de administradores. Em incidente, fechar a API, aguardar transações e revisar a política antes de reabrir. Isso não muda JWTs ou sessões de outras aplicações.

## Recuperação sem restauração global

**Falha antes do commit:** cada lote reverte sua própria transação. Capturar SQLSTATE/metadados do erro sem PII, conferir que o lote não deixou seus objetos parcialmente aplicados e não repetir cegamente. Uma role criada em lote anterior não significa que os lotes seguintes possam presumir sucesso.

**Falha depois de liberar API:** aplicar o SQL exato R1-quarentena.sql.txt após autorização operacional. Ele revoga endpoints públicos e privados de RPC e todas as colunas de leitura novas. Não apaga registros, não desativa triggers e não remove as policies de elegibilidade antigas acrescidas. A função de elegibilidade necessária às policies continua executável para evitar erro de privilégio na avaliação de RLS. O teste local confirma que a nova API fecha, os dados ficam e um vínculo encerrado continua bloqueado.

**Falha no enforcement legado:** R2-elegibilidade-legada.sql.txt é backout separado e só remove as sete policies restritivas que este pacote criou; as policies e funções originais não foram substituídas. Ele pode readmitir memberships ativas cujo contrato foi encerrado. Portanto exige decisão explícita, janela controlada e controles de acesso compensatórios antes de executar. Não é resposta automática a um erro de cadastro. O teste local comprova esse retorno ao comportamento anterior sem tocar no trigger de Auth ou na sentinela alheia.

**Dados já usados:** não aplicar DROP TABLE/CASCADE, TRUNCATE, seed reverso, reset ou restore do projeto inteiro. Fechar escrita, localizar comandos por correlação/recibo, capturar evidências autorizadas e comparar versões antes de preparar uma compensação específica. Não sobrescrever mudanças legítimas posteriores, não alterar pessoas de outro lote/org e não apagar auditoria. SQL compensatório com IDs reais só pode ser preparado após análise dos dados e autorização apropriada; não pode ser uma lista genérica adivinhada agora. Se for necessária exportação técnica, aprovar acesso, criptografia, local e prazo de descarte.

Os lotes não contêm exclusão operacional de pessoa, fusão automática, edição retroativa arbitrária ou alteração de Auth. A limpeza de objetos fechados após uma desistência deve ser uma tarefa separada baseada em dependências e ausência de dados, nunca `DROP OWNED BY` global no projeto compartilhado.

## Pendências reais para autorização

Não há decisão técnica rotineira pendente nem corpos de função a completar neste pacote. Permanecem:

1. Revisão final de segurança dos hashes/corpos e autorização individual dos lotes, especialmente role/backend, grants e enforcement em tabelas existentes.
2. RH/jurídico: finalidade/base legal e prazos de retenção para cadastro, contatos, pedidos, nomes anteriores/auditoria e concessões privadas. Privado permanece sem concessões até aprovação.
3. Aprovação operacional do conteúdo dos catálogos reais da organização e, nominalmente, das associações administrativas, exceções de acesso com prazo e capacidades especiais; nenhuma atribuição real foi presumida.
4. Após essas autorizações, homologação do caminho Auth/PostgREST hospedado e medição de carga/locks no recorte autorizado, sem gravar fixtures no projeto ativo.

Não é necessário reabrir D01–D15. Agendamento de movimentações, aditivos contratuais, retificações retroativas e desassociação de contas não são oferecidos por esta API inicial; qualquer ampliação precisa de uma operação específica com o mesmo nível de validação, não permissão para SQL livre.
