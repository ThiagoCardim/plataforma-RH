# Onboarding e central unificada — demonstração local

## Entrega

`/politicas-compliance` reúne os 12 documentos fictícios em uma única central. As antigas URLs de Compliance e Políticas Internas redirecionam para a nova central, inclusive os documentos individuais. O editor, os blocos de arquivo, filtros, estados, publicação, duplicação, arquivamento, versões e confirmação de leitura permanecem disponíveis. IDs dos exemplos são preservados.

`/onboarding-offboarding` agora apresenta Onboarding, com Visão Geral, Onboardings, Modelos de Onboarding e Histórico. Não implementa processos de offboarding nem altera a Base Central.

## O que testar

- Indicadores de jornadas em andamento/concluídas, atrasos e progresso médio; pesquisa e filtros por setor e vínculo.
- Kanban por profissional, arrastar e soltar entre fases e seletor de fase como alternativa para teclado/touch. Colunas com nomes, cores e ordem configuráveis; inclusão de fases e remoção de fases vazias. A coluna de ID `done` mantém a validação de conclusão mesmo se renomeada.
- Novo processo com profissional fictício e combinação automática de modelo institucional por vínculo + modelo técnico por setor/cargo/vínculo. Só modelos aprovados entram na combinação; modelos específicos têm prioridade sobre os genéricos. CLT usa 90 dias, Estágio 60; PJ inicia em 30 e pode ser ajustado. A duração das jornadas também pode ser ajustada por RH.
- Duas trilhas independentes dentro do card, com responsáveis, atividades obrigatórias, prazos, progresso e conteúdo. O quadro não permite concluir uma jornada com atividades obrigatórias pendentes.
- Modelos com etapas editáveis, inclusão, remoção e reordenação; duplicação, revisão e aprovação pelo RH/Diretoria. Alterações nos modelos não modificam jornadas existentes: cada processo recebe uma cópia das etapas e guarda os nomes e versões de origem.
- Editor de etapas com textos, checklists interativos, apresentações por arquivo/link, vídeo local MP4/WebM ou link externo, imagens locais, arquivos, links HTTP(S), formulários com respostas e reuniões com agendamento demonstrativo. Arquivos locais até 10 MB; sem executores de HTML ou carregamento automático de embeds externos. Apresentações Office são abertas/baixadas; não há conversor de PowerPoint.
- Histórico de ações, conclusão/arquivamento e reabertura pelo RH. Botão para restaurar os dados fictícios de cada módulo.

## Perfis e autorização

A sessão, a organização e os papéis vêm das guardas existentes no servidor. O novo módulo exige `home.view`. Nenhuma atribuição de papel, grant, RLS ou permissão remota foi alterada.

- RH/Diretoria com `people.management.view`: administra o quadro, cria jornadas, configura etapas e aprova modelos.
- Liderança: recebe apenas jornadas demonstrativas atribuídas à sua identidade; gerencia somente a trilha técnica e seus próprios modelos técnicos. Não administra colunas, não cria processos nem aprova modelos. A trilha institucional fica disponível para acompanhamento.
- Profissional: recebe apenas seu processo fictício, etapas marcadas para acesso e com responsável Profissional; pode completar as atividades, checklists, respostas e agendamentos autorizados. Não recebe modelos nem etapas administrativas.

Os fixtures são projetados no servidor antes da serialização. A leitura do estado local reaplica a projeção do perfil. Os seeds vinculam uma identidade fictícia de jornada à identidade autenticada apenas para demonstrar o escopo; não representam atribuições reais de equipe, conta, liderança ou contrato. Não há seletor de perfil que contorne as guardas.

## Persistência e limites

IndexedDB `youcon-demo-v1`, store `demos`: documentos, jornadas, modelos, atividades, respostas e arquivos ficam apenas no navegador de origem. As chaves incluem usuário, organização, perfil e versão do formato. Arquivos são guardados como Blobs e recebem novas URLs locais ao recarregar. Nenhum upload, convite, agendamento de calendário, registro de ponto ou escrita remota é realizado.

Não há sincronização entre contas, abas ou dispositivos. Mudar o hostname de Preview cria outra origem e, portanto, outro armazenamento local; use o link fixo para manter a demonstração entre versões compatíveis. Limpar dados do site ou restaurar a demonstração descarta os testes locais. Falhas de armazenamento exibem aviso; pode haver sessão somente em memória quando IndexedDB estiver indisponível. Use exclusivamente informações e arquivos fictícios. O histórico local é demonstrativo e não é auditoria oficial.

A futura persistência compartilhada, com atribuições reais, revalidação de operações no servidor e armazenamento de arquivos, depende de etapa separada e autorização própria.

## Validação

- Lint, TypeScript e build Next.js com URL/chave sintéticas de loopback.
- Vitest: 98 testes aprovados, incluindo combinações de modelos, escopo por perfil, progresso, prazos e regressão de Pessoas/documentos/navegação.
- `RUN_BUILT_APP=1 node tests/browser/onboarding.mjs`: Chromium com Auth/Data API fictícios em loopback. RH, Diretoria, liderança e profissional; drag/drop, filtros, colunas, editor, arquivos após reload, aprovação de modelo, durações, respostas/checklists persistidos e responsividade.
- `RUN_BUILT_APP=1 node tests/browser/people.mjs`: regressão dos fluxos existentes da Base Central, navegação e editor unificado.
- A API fictícia rejeita qualquer método diferente de GET. Nenhum teste usa o Supabase compartilhado.

Capturas: [visão geral](review/overview.png), [quadro](review/kanban.png), [jornada](review/journey.png), [modelos](review/templates.png) e [mobile](review/mobile.png).
