# Recrutamento e Seleção — processo e Banco de Currículos locais

Continuidade dos módulos existentes (`d34c3db` e política de homologação `17b6f0d`), sem reiniciar os cadastros. Branch `feat/recruitment-resume-database`. Ver [Banco de Currículos: fluxo e limites](BANCO_CURRICULOS.md) e [validação atual](VALIDACAO_CURRICULOS.md). Nenhuma migração ou escrita no Supabase, alteração de Auth/RLS/grants/Storage, integração externa, merge ou produção.

## Navegação e autorização

| Página | Rota | Acesso |
| --- | --- | --- |
| Processo Seletivo (entrada principal) | `/recrutamento/processo-seletivo` | RH completo; Diretoria gerencial; liderança somente designados |
| Gestão de Vagas | `/recrutamento/vagas` | RH; Diretoria gerencial/financeira |
| Admissão Digital | `/recrutamento/admissao` | RH |
| Banco de Currículos | `/recrutamento/talentos` | RH |
| Indicadores | `/recrutamento/indicadores` | RH; Diretoria |
| Configurações | `/recrutamento/configuracoes` | RH |
| Formulário independente protegido | `/candidatura-demonstrativa` | RH, demonstração sem área administrativa |

A categoria tem exatamente essa ordem. Match aparece no processo e no banco. Rotas anteriores redirecionam, preservando parâmetros dos instrumentos individuais. As guardas novas (`recruitmentWorkflowScope`) usam exclusivamente a identidade/organização/papéis de `careerScope()`, exigindo a permissão gerencial existente. Profissionais não recebem acesso à gestão. O formulário independente continua autenticado, inclusive em links de admissão; o token identifica o formulário e **não** substitui autorização. Não há coleta pública habilitada, seletor de perfil ou bypass de login.

## Operação do RH

- Kanban único com 12 etapas operacionais. A antiga coluna Banco de Talentos foi removida com preservação dos processos no histórico/arquivamento e conversão da classificação para estrela. Movimentação livre com motivo, por arrastar/soltar, seletor acessível ou lote. Não exige concluir todas as etapas ou seus checklists para movimentar. Etapas ocupadas não podem ser excluídas. Há modos tabela e cards, seleção múltipla e filtros combinados por área/setor/nível/cidade/formação/competências/softwares/disponibilidade/vínculo/vaga/origem/tags/etapa/período. Buscas podem ser salvas, inclusive reaproveitando as buscas anteriores.
- Entrada independente de vaga. O formulário geral tem experiências autodeclaradas configuráveis, privacidade, cor, mensagem de confirmação, condições, descrições, ordenação e anexos locais. Coincidências de nome, e-mail ou telefone criam uma revisão pendente, sem sobrescrever ou unificar automaticamente. O RH compara campos e pode unificar ou manter registros separados com justificativa.
- Ficha lateral preserva currículo, portfólio, respostas, evidências, Match, instrumentos DISC/Temperamentos, entrevistas, testes técnicos, notas, propostas, exceções e histórico. A experiência validada pelo RH é separada da declaração original. Designações técnicas e compartilhamento explícito de CV/respostas permanecem disponíveis, exclusivamente locais.
- Banco de Currículos reúne todos os cadastros canônicos, com ou sem processos. A estrela de talento é independente da etapa e exclusiva da gestão RH. Há visões de todos, novos, talentos, em seleção, desatualizados, propostas recusadas, ex-profissionais e arquivados, além de versões de CV, contatos, convites de atualização e importação demonstrativa. Uma nova oportunidade iniciada pelo Banco preserva os resultados anteriores em outro ciclo; processos operacionais ativos impedem reativação concorrente. Um processo posterior a uma contratação preserva o ciclo anterior e cria outro identificador, sem substituir sua história.
- Vagas são gerenciais, sem Kanban próprio e sem conteúdo longo obrigatório. Cargo/setor/vínculo/nível/posições/motivo/datas/orçamento/custo opcional/requisitos/observações são editáveis. Há cópia, pausa, reabertura, cancelamento e encerramento. Preenchimento parcial, posições restantes e data de preenchimento integral vêm de formalizações confirmadas, nunca da coluna Contratados. Vagas integralmente preenchidas permanecem protegidas contra alterações retroativas das posições.
- Match consulta toda a base elegível (inclusive cadastros sem processo), admite filtros de disponibilidade/atualidade e priorização opcional de talentos, e aceita vaga ou requisitos avulsos, critérios/pesos revisáveis, seleção individual/lote, comparação, cobertura, resumo, evidências, lacunas e perguntas. Pesquisa por linguagem natural usa correspondência simples de termos profissionais, sem serviço de IA. Não há OCR ou extração automática de currículo. Critérios pessoais irrelevantes são rejeitados pelo validador existente. Compatibilidade demonstrativa não movimenta ou seleciona candidatos.

## Admissão e vínculo

`Contratados` significa **aprovação para contratar**, com status ainda ativo no processo. A movimentação gera uma única admissão por identificador de ciclo; ir e voltar não gera outra. Movimentar a admissão para a última coluna também não ativa vínculo.

- **CLT:** acompanhamento externo Flash com referência, confirmação externa, responsável, datas, pendências e anotações. Sem API ou reprodução da coleta documental da Flash.
- **Estágio / PJ:** fluxos separados com cópias versionadas de formulários, documentos, instruções, campos, checklists e prazos. Coleta individual protegida com arquivos fictícios, e acompanhamento pelo RH. São exigidas assinatura, documentação e informações obrigatórias antes da confirmação.
- Formalização exige ação e confirmação explícitas do RH, aprovação ainda vigente no processo, ausência de vínculo local ativo, início não futuro, atividades/campos obrigatórios, posição disponível, correspondência de valor e aceite de eventual proposta existente, e orçamento ou exceção da Diretoria para o valor exato. Se houver contratação anterior, a elegibilidade precisa estar revisada como Elegível. Finalização repetida é idempotente.
- O vínculo local (`employments`) é uma estrutura demonstrativa de continuidade. Não cria cadastro real na Base Central, contrato, salário, pessoa, conta, Auth, pagamento ou revogação. Datas futuras permanecem em acompanhamento de admissão até poderem ser confirmadas, sem assumir vínculo ativo antecipadamente.
- O pacote para Base Central e Onboarding contém somente os campos autorizados (`name`, `email`, `phone`, `city`), com autor/organização e referência canônica. O RH inicia o Onboarding **no módulo existente**, mediante ação explícita, usando modelos aprovados compatíveis. A conta fica `unlinked`; nenhum papel ou acesso é concedido. Não copia notas, instrumentos, currículo ou condições financeiras.

## Offboarding e relacionamento

O módulo existente de Offboarding é a origem do desligamento. Seu painel de contratações locais permite selecionar um vínculo ativo e iniciar um processo com modelos institucionais e operacionais compatíveis, sem repetição pela referência do vínculo.

Arquivamento não encerra vínculo. Depois das atividades obrigatórias, o RH confirma explicitamente a data e a conclusão. Isso encerra somente o vínculo local, registra o processo/data/autor na timeline e mantém recrutamento, proposta e admissão. Não executa rescisão ou revogação real. Recontratação exige outro ciclo e revisão de elegibilidade; nunca reabre ou sobrescreve uma contratação anterior.

## Configurações e histórico

O RH edita etapas, cores, prazos, função operacional, campos condicionais, checklists, cards/tags, formulários, critérios avulsos do Match, documentação/fluxos por vínculo e modelos de entrevistas, DISC, Temperamentos, técnica, mensagens, propostas e motivos. Regras de automação podem ter escopo de etapa, setor e vínculo; registram simulação/rastreabilidade local e podem preparar rascunhos, sem envio real, decisão ou formalização automática. Instrumentos aplicados e admissões preservam snapshots; DISC e Temperamentos não recebem metodologia definitiva, diagnóstico ou uso automático na decisão.

A atualização da estrutura usa a **mesma chave local**, com `resumeVersion: 1` sobre `workflowVersion: 2`. Candidatos, notas, avaliações, propostas, respostas e anexos são conservados. Aplicações anteriores guardam `legacy` com etapa/status/vaga, definições completas de etapas e visitas originais; o processo atual é projetado no quadro central e os demais ciclos ficam históricos. Etapas personalizadas anteriores sem correspondência ficam preservadas no snapshot, com revisão humana da classificação atual. Restaurar exemplos requer confirmação e afeta apenas o Recrutamento deste escopo; não apaga cópias já autorizadas no Onboarding.

## Indicadores

Passagens observadas, conversão temporal entre etapas, saltos e tempo médio; currículos únicos e ciclos; qualificados; vagas/formalizações; setor/vínculo/origem; aceite sobre propostas resolvidas; motivos de recusa/reprovação; origem Banco; custo informado por contratação; efetividade de fontes; saídas até 90 dias; retenção de 30/60/90 dias somente para coortes maduras. Não presume passagem pelas colunas puladas ou cria resultados sem base.

Os filtros recortam ciclos pela data de entrada, setor, vaga, vínculo e origem; formalizações/saídas são associadas a esses ciclos. A comparação usa o intervalo imediatamente anterior de igual duração quando início/fim são informados. Custos não cadastrados e coortes sem observação suficiente exibem ausência de dados. Retenção é um indicador demonstrativo, sem promessa ou inferência sobre casos não observados.

## Persistência e segurança da demonstração

IndexedDB `youcon-demo-v1`, store `demos`, chave `recruitment-v1:${organização}:${usuário}:${papéis ordenados}:${vínculo}`. Arquivos Blob são serializados/restaurados pelo armazenamento existente. Não existe sincronização entre contas, dispositivos ou abas simultâneas. Recarregue o quadro após usar o formulário em outra aba. Falha de armazenamento é indicada na interface.

A projeção de liderança elimina orçamento, notas confidenciais, DISC, Temperamentos, admissão, vínculos e relacionamento; mostra apenas processos designados, pareceres compartilhados e CV/respostas autorizados. A Diretoria recebe projeção gerencial sem identidade pessoal, arquivos, instrumentos ou notas. Históricos antigos privados também são removidos dessas projeções.

Privacidade e retenção são demonstrativas, configuradas pelo RH. Alterar finalidade/prazo não reescreve consentimentos e datas anteriores. Prazos vencidos são alertas para revisão humana; não há eliminação automática. A anonimização remove também os novos anexos e dados privados de admissão/relacionamento, conservando metadados anônimos. Cópias já autorizadas em outros módulos não são apagadas automaticamente; exigem governança futura.

IndexedDB e JavaScript não constituem autorização, relógio ou auditoria invioláveis. Validação autoritativa, coleta pública, assinatura, processamento de CV, integração de dados e sincronização dependem de uma futura etapa de servidor explicitamente autorizada. Usar somente informações e arquivos fictícios.

## Preview e recuperação

Push desta branch pode gerar apenas deployment **Preview**. Concluir validações proporcionais e conferir projeto, SHA, branch, target e READY, mantendo proteção por login. Pela autorização permanente de 26/11/2026, atualizar automaticamente `https://youcon-people-preview.vercel.app` sem nova aprovação por entrega e verificar o destino. Falhas obrigatórias mantêm a versão anterior. Não usar links de bypass, merge ou promoção de produção. Ver [fluxo vigente](../PREVIEW.md).

Recuperação: conservar o deployment anterior READY; em falha da atualização, recuperar somente o alias de Preview para o deployment anterior conhecido e conferir o destino. A atualização local usa o namespace antigo e conserva os snapshots originais; recuperar o deployment não desfaz automaticamente alterações no IndexedDB. Não depende de restauração do Supabase ou de mudanças na outra aplicação.
