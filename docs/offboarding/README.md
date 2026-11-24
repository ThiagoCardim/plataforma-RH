# Offboarding demonstrativo

Rota `/offboarding`, subaba de Pessoas imediatamente após Onboarding. O módulo reutiliza o workspace, Kanban, modal, indicadores, editor de etapas, blocos livres, histórico e persistência IndexedDB já usados pelo Onboarding. Não há cópia de toda a interface nem integração com execução de desligamentos.

## Recursos

- Visão Geral, Offboardings, Modelos de Offboarding e Histórico.
- Quadro com drag/drop, alternativa por seletor para teclado/touch, nomes/cores/ordem de colunas, criação e remoção de colunas vazias; pesquisa por nome e filtros de setor/vínculo.
- Seis processos fictícios, incluindo um histórico concluído. Modelos RH e operacionais para as seis combinações CLT/Estágio/PJ × Voluntário/Involuntário, mais um modelo setorial em revisão.
- Combinação de versões aprovadas por setor, cargo, vínculo e tipo de desligamento. Não mistura modelos voluntários e involuntários. Modelos específicos têm prioridade sobre os genéricos. Jornadas recebem cópias das etapas: editar um modelo não altera processos em andamento.
- Trilhas RH e operacional independentes. RH controla pendências administrativas e contratuais, conferência demonstrativa de acessos e entrevista de desligamento; liderança acompanha transferência de projetos/conhecimento e devolução de equipamentos.
- Etapas com responsáveis, prazo em dias após início, atividades obrigatórias e os nove blocos compartilhados: texto, checklist, apresentação, vídeo, imagem, arquivo, link, formulário e reunião. Arquivos locais até 10 MB, respostas e checklists persistidos no navegador.
- Progresso, pendências, atrasos e histórico por processo. Não permite concluir/arquivar com atividades obrigatórias pendentes nas duas trilhas. Reabertura pelo RH.
- Duração inicial demonstrativa de 30 dias, ajustável. Não representa prazo legal, aviso prévio ou cálculo rescisório.

## Escopo de acesso

Guardas de sessão/organização existentes preservadas. A rota exige `home.view` e RH/Diretoria com `people.management.view`, ou o papel existente de liderança. Profissionais recebem acesso negado e não veem a subaba.

RH/Diretoria têm controle geral, configuram modelos e aprovam revisões. Lideranças recebem somente processos atribuídos à identidade autenticada, apenas etapas da trilha operacional com responsável Liderança, seus modelos operacionais e eventos operacionais identificados. Não recebem a trilha RH, entrevista, pendências contratuais, dados da revogação, modelos administrativos, tipo de desligamento do processo ou nomes de modelos de origem. Não movem cards, não configuram colunas e não aprovam modelos.

A projeção ocorre no servidor antes de serializar os fixtures e novamente ao carregar o armazenamento local. O editor restringe os responsáveis conforme a trilha/perfil. Os dados de identidade são obtidos da sessão validada, sem seletor de perfil ou bypass. A identidade autenticada é usada apenas para ilustrar atribuições fictícias locais; não representa designação real de equipe.

## Independência e limites

Offboarding usa chaves `offboarding-v1:<organização>:<usuário>:<perfil>`, separadas de `onboarding-v1`. IDs de exemplos, modelos, eventos e snapshots são independentes. Compartilha apenas a infraestrutura IndexedDB `youcon-demo-v1` / store `demos`. Restaurar a demonstração do Offboarding não restaura a do Onboarding.

Dados e Blobs permanecem somente na origem do navegador, sem sincronização entre contas, abas ou dispositivos. Falhas de armazenamento exibem aviso. Use apenas informações e arquivos fictícios. O histórico não é auditoria oficial.

Marcar “revogação fictícia como conferida”, concluir tarefas, arquivar ou reabrir processos só altera o estado local. Não existe operação de desligamento, revogação de login, alteração de vínculo, rescisão, cálculo, pagamento, comunicação, agendamento real, devolução física ou mudança de projetos. Nenhuma alteração de Auth, Supabase, permissões remotas, produção ou migrations está incluída.

## Validação

- Vitest: 111 testes aprovados, incluindo escopo operacional, projeção de dados, composição por tipo/vínculo/setor e regressões dos módulos anteriores.
- Lint, TypeScript e build Next.js com URL/chave sintéticas em loopback.
- Navegador: `RUN_BUILT_APP=1 node tests/browser/offboarding.mjs`; Auth/Data API inteiramente fictícios. RH, Diretoria, liderança e negativa para profissional; drag/drop, filtros, colunas, combinação por tipo, arquivos depois de reload, responsáveis restritos, aprovação de modelo e mobile.
- Regressões: `tests/browser/onboarding.mjs` e `tests/browser/people.mjs` usando o mesmo ambiente fictício. A API sintética rejeita qualquer método diferente de GET.

Capturas: [visão geral](review/overview.png), [Kanban](review/kanban.png), [processo](review/process.png), [modelos](review/models.png), [liderança](review/leader.png) e [mobile](review/mobile.png).
