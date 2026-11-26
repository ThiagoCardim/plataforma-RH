# Fluxo vigente de homologação

Desde 26/11/2026, o usuário concede autorização permanente para atualizar automaticamente **https://youcon-people-preview.vercel.app** após concluir cada implementação ou ajuste solicitado. Não existe mais aprovação manual por versão para esse alias. A regra consta do [AGENTS.md](../AGENTS.md) e prevalece sobre referências históricas ao fluxo anterior. Permanece válida nas próximas entregas e em branches diferentes, até orientação posterior do usuário.

## Alvos autorizados

| Item | Identificação |
| --- | --- |
| Repositório | `ThiagoCardim/plataforma-RH` |
| Projeto Vercel | `plataformarh` / `prj_XvEhxHGub2ILTIbGu9drQ4ikB3P8` |
| Equipe Vercel | `team_7GKdyWHAUAJ7Se6HMSzP7USo` |
| Único alias autorizado | `youcon-people-preview.vercel.app` |
| Ambiente | Preview; `target: null` na configuração atual, nunca `production` |
| Produção a preservar | `plataformarh-gamma.vercel.app`; consultar e conservar seu destino antes/depois de cada operação |

Os identificadores são referências de alvo, não credenciais. Conferir o estado real na Vercel em cada entrega; divergências de identidade, proteção ou ambiente não devem ser corrigidas por mudanças de configuração não autorizadas.

## Sequência operacional

1. Concluir a alteração em branch de funcionalidade, preservando mudanças existentes e os limites de escopo. Fazer commit/push sem merge. A integração Git pode construir uma Preview automaticamente; isso não basta para atualizar o alias.
2. Executar as validações pertinentes e registrar o resultado para o commit candidato. Ajustes apenas documentais precisam de revisão de consistência e `git diff --check`; não exigem repetir toda a suíte de interface se o código/configuração da aplicação permanecer idêntico a uma versão validada. Mudanças de código exigem lint/tipos/build e testes/regressões proporcionais aos comportamentos afetados. Falhas obrigatórias impedem a troca.
3. Resolver o deployment pelo **SHA e branch exatos**. Conferir projeto/equipe, ambiente Preview e estado **READY**. Um deployment READY de outra tarefa não substitui o candidato. Não apontar para BUILDING, ERROR, CANCELED, produção ou um build com verificações obrigatórias pendentes/reprovadas.
4. Consultar o destino atual do alias fixo, o destino de produção e a configuração de proteção. Conferir que o candidato conserva a autenticação e os guardas existentes. A configuração de referência é SSO habilitado (`all_except_custom_domains`); preservá-la sem ampliá-la ou reduzi-la. Não gerar links de bypass/compartilhamento, obter segredos ou desabilitar proteção para testes. Registrar separadamente validação funcional local, verificação de configuração e eventual verificação HTTP remota; uma restrição de rede não comprova resposta do aplicativo.
5. Estando tudo conforme, atribuir automaticamente **apenas o alias fixo de Preview** ao deployment validado, usando a conexão Vercel autenticada disponível. Não solicitar aprovação adicional. Se o alias já aponta para o candidato correto, confirmar o estado e não reatribuir desnecessariamente. Não usar promote, rollback de produção, mudanças de domínio de produção ou alterações de proteção.
6. Reconsultar o alias e confirmar o ID do deployment/SHA esperado, READY, proteção mantida e destino de produção inalterado. Não presumir sucesso por uma resposta incompleta da operação. Conservar o deployment anterior e registrar IDs/commit/branch, validações, resultado e limitação real de verificação, sem tokens ou dados pessoais.
7. Encerrar com um resumo das alterações e **o mesmo link fixo**. Não terminar com pedido de autorização para a atualização ordinária de homologação.

## Falhas e recuperação

- Falha de validação, build sem READY, commit divergente, alvo inesperado ou proteção não confirmada: conservar o alias anterior e informar a causa. Corrigir o que estiver no escopo autorizado, sem liberar uma versão parcialmente validada.
- Falha/timeout na atribuição: consultar o destino efetivo. Se a operação não ocorreu, manter o destino anterior. Se houver destino incorreto ou falha na conferência do novo destino, recuperar somente o alias de Preview para o deployment anterior previamente registrado e conferir a recuperação. Não apagar deployments, modificar dados ou executar rollback global.
- Falha na conferência de produção/proteção: informar a divergência e investigar em leitura; a autorização de Preview não permite corrigir produção, autenticação ou permissões.
- Trocar o alias não migra nem sincroniza IndexedDB ou dados locais entre domínios. Uma recuperação do deployment também não desfaz automaticamente mudanças locais de armazenamento. Preservar compatibilidade/histórico conforme a alteração implementada.

## Automação e alcance

O agente que conclui a tarefa executa esse procedimento sem uma nova rodada de aprovação. Não há workflow GitHub de aprovação versionado neste checkout; a construção de Preview ocorre pela integração Git existente. Não é necessário criar segredos, alterar configurações de aprovação do GitHub/Vercel ou instalar outra automação para aplicar esta autorização. Um futuro workflow deverá manter as mesmas verificações e não mover o alias indiscriminadamente a cada push.

A dispensa de confirmação vale exclusivamente para a atualização desse alias. Continuam independentes a publicação de conteúdos pelo RH, aprovação financeira, revisão de segurança, operações em banco, acessos e quaisquer decisões de negócio. Não alterar Supabase compartilhado, Auth, RLS, grants, produção, portal operacional, outras aplicações ou permissões. Não executar migrations, seeds, merges ou publicação em produção.
