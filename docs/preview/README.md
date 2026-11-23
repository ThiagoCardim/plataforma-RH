# Preview fixa YouCon People

URL: https://youcon-people-preview.vercel.app

Alias criado em 23/11/2026, apontando ao deployment `dpl_XVq8ymVZTvZXP6dmyhsRN3SagrDj`, commit `476957f3a2ae86f45b845db7c77411c218cca809`, estado READY, projeto `plataformarh`, ambiente Preview. A configuração Vercel consultada mantém `ssoProtection.deploymentType=all_except_custom_domains`. Não foi criado nenhum bypass, token de compartilhamento ou redirecionamento. Auth da plataforma não foi alterado.

## Estado da automação

Implementada em `.github/workflows/approve-preview.yml` e `scripts/preview/approve.py`, mas **ainda não ativada**. Duas dependências:

1. O GitHub exige o arquivo do workflow na branch padrão (`main`) para mostrar o botão Run workflow. Esta entrega fica em `chore/youcon-fixed-preview`; não há merge nem mudança de main. A integração em main precisa ser planejada separadamente para não disparar produção. Não basta trocar a branch no botão do GitHub.
2. Um administrador deve configurar `YOUCON_PREVIEW_VERCEL_TOKEN` nos secrets do GitHub Actions, diretamente no GitHub, com o menor escopo disponível para consultar este projeto e atribuir aliases na equipe autorizada. Não colar credenciais na conversa. Não há token Vercel disponível no ambiente e o conector não administra secrets do GitHub.

A tentativa de ampliar o acesso de rede local para verificar o login anonimamente não foi concluída; a política permaneceu inalterada. A atribuição do alias e a proteção configurada foram confirmadas pela API Vercel, mas a checagem HTTP sem sessão do novo hostname ainda exige verificação. O workflow recusa mudanças caso não receba HTTP 401 da proteção Vercel tanto do candidato quanto do alias. Isso não substitui uma validação funcional do login da plataforma com a conta do usuário.

## Aprovar uma atualização (após ativação)

1. Testar a Preview de qualquer branch e anotar o ID `dpl_...` e o SHA completo do commit.
2. No GitHub, abrir Actions → Aprovar Preview YouCon People → Run workflow.
3. Manter a branch do **workflow** em main, preencher o deployment e o SHA, marcar a aprovação e executar. A branch do **deployment** pode ser qualquer branch de desenvolvimento.
4. Aguardar o resultado verde. O mesmo endereço fixo passa a servir a versão escolhida.

Não há atualização em push, aprovação implícita, merge automático, build ou promoção a produção. Apenas quem já tem acesso de escrita ao repositório pode disparar o workflow. Não se modificam permissões existentes.

## Validações e recuperação

O script valida ID, SHA, projeto, repositório, READY, ambiente não produtivo, configuração SSO e resposta HTTP 401 sem cookies ou bypass. A URL fixa é constante; entradas não podem escolher outro alias, equipe ou projeto. O job executa somente em main, com `contents: read`, sem persistir credenciais do checkout e sem executar código da branch candidata. Usa biblioteca padrão Python e checkout fixado por SHA. Execuções são serializadas e não cancelam atualizações em andamento.

Falhas anteriores à atribuição não alteram o destino. Atribuição substitui o destino sem excluir o alias. Falhas posteriores tentam restaurar e verificar o deployment anterior, cujo ID é registrado antes da alteração. Em indisponibilidade da API/rede durante a recuperação, não é possível garantir restauração automática; um administrador deve reatribuir somente este alias ao ID registrado. Não usar `promote`, `rollback` de produção ou remover o alias. A automação não grava no Supabase.

Testes locais: `python3 -m unittest discover -s scripts/preview -p 'test_*.py' -v`. Seis testes com APIs fictícias cobrem aceitação de Preview, rejeição de produção/outro projeto/SHA/host/estado inválidos, ausência de escrita antes de READY e restauração em falha de proteção após troca. Nenhuma chamada remota nos testes.
