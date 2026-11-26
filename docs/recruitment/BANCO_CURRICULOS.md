# Banco de Currículos — cadastro único e revisão humana

Continuidade da versão `17b6f0d`, em branch de funcionalidade. Somente dados fictícios e IndexedDB. O fluxo de homologação automática autorizado no AGENTS.md permanece vigente; não há escrita no Supabase, coleta pública, Pipefy/WhatsApp/IA externos, migrações, merges ou alterações de produção/permissões.

## Cadastro e operação

A rota existente `/recrutamento/talentos` passa a se chamar **Banco de Currículos**, preservando links antigos. Reúne todos os candidatos não anonimizados ou substituídos por cadastro canônico, mesmo sem processo seletivo. Rejeição, contratação, desligamento e arquivamento não excluem a pessoa do Banco.

Visualizações rápidas: Todos os currículos, Novos cadastros (últimos 30 dias), Talentos selecionados, Em processo seletivo, Currículos desatualizados, Propostas recusadas, Ex-profissionais e Arquivados. Desatualizados corresponde ao último intervalo de atualidade; Atualização recomendada também pode ser consultada pelo filtro específico. Os filtros profissionais existentes podem ser combinados com disponibilidade, atualidade, setor, vínculo, vaga, origem, tags e período de cadastro. Há tabela, cards, buscas salvas, seleção múltipla e ficha lateral completa.

A **estrela de talento** é uma classificação RH independente da etapa. Marcar/desmarcar não movimenta nem encerra processos. O Kanban mantém 12 colunas operacionais e continua como entrada principal do módulo. O Banco não cria novos atalhos no menu além da subaba renomeada.

## Atualidade, contatos e currículo

- Primeiro cadastro permanece separado da data de atualização do currículo e do último contato. Na unificação, a primeira data é a mais antiga. Unir dados antigos não apresenta silenciosamente um currículo como novo.
- Limites iniciais: até 3 meses Atualizado; acima de 3 até 6 Regular; acima de 6 até 12 Atualização recomendada; acima de 12 Desatualizado. São meses de calendário, incluindo os limites e ajustando o último dia do mês. O RH altera os três intervalos em Preferências.
- Edição cadastral/CV cria snapshot com autor, momento, versão, campos profissionais e anexos anteriores. Contatos, notas internas, estrela e avaliações não renovam artificialmente a data do currículo. Confirmação pelo convite, mesmo sem modificar campos, registra a atualização e a resposta recebida.
- Disponibilidades: Disponível para oportunidades; Empregado, mas aberto a propostas; Sem interesse no momento; Não respondeu ao contato; Disponibilidade desconhecida. O RH registra nota de contato, situação, data e lembrete de retorno, com conclusão explícita do lembrete.
- Anexos continuam locais, com visualização/download via Blob e persistência após reload. Não há OCR ou extração automática de PDF/Word. Novos uploads não validam evidências profissionais automaticamente.

As versões guardam seu próprio prazo de retenção. O RH pode eliminar o conteúdo das versões vencidas, preservando metadados; editar a configuração não estende os consentimentos anteriores. A anonimização existente abrange versões, contatos, convites, revisões relacionadas e aliases unificados, além das estruturas antigas. Não representa uma política LGPD definitiva ou exclusão automática entre módulos: cópias previamente autorizadas no Onboarding e outros dispositivos exigem governança própria.

## Convite de atualização cadastral

RH pode gerar convites individuais ou em lote, copiar o link e uma mensagem configurável com `{nome}`, `{link}` e `{validade}`. A validade local padrão é 48 horas, configurável entre 1 e 168. Cada convite usa dois UUIDs criptográficos, fica vinculado a organização/pessoa/revisão, tem uso único, expira e pode ser revogado. Emitir outro convite revoga o anterior. Uma edição RH posterior à emissão exige novo convite antes de sobrescrever dados.

A prévia `/candidatura-demonstrativa?atualizar=...&token=...` mostra exclusivamente um DTO de campos cadastrais/profissionais e arquivos atuais. Não oferece avaliações, notas, pretensão, elegibilidade de recontratação, classificações privadas ou navegação administrativa. Payloads não podem substituir pessoa, organização, autor, datas originais ou campos internos. O envio atualiza o mesmo cadastro e não abre outra candidatura. Coincidências com outros cadastros continuam sujeitas a revisão humana.

**Limite deliberado:** simula a experiência do candidato sem criar conta ou solicitar um segundo login de candidato, mas a demonstração exige a sessão RH já autorizada e a proteção existente da Preview. Não é um formulário público sem login. O token é um identificador demonstrativo, não um bypass de autenticação. Os dados e o link só funcionam neste navegador/conta/organização; após preencher em outra aba, recarregue o quadro. Copiar mensagem não a envia ao WhatsApp.

A futura experiência pública dependerá de uma etapa autorizada de servidor: token com armazenamento seguro, expiração/consumo autoritativos, validação de dados/arquivos, controle de abuso, retenção/finalidade e DTO mínimo independente do estado RH. JavaScript, relógio local e IndexedDB não fornecem essas garantias. Nenhuma dessas integrações remotas foi ativada.

## Revisão de duplicidades

Nome normalizado, e-mail sem espaços/maiúsculas e telefone em dígitos (incluindo normalização brasileira com/sem +55) sinalizam possibilidades, não comprovam identidade. Campos vazios não são tratados como coincidência.

- Novo recebimento coincidente permanece numa revisão pendente, com os dados/arquivos e respostas condicionais do formulário recebido. Não sobrescreve, ignora silenciosamente nem funde o cadastro existente.
- O RH compara dois cadastros, escolhe por campo qual informação manter, informa uma justificativa e confirma a decisão. Em múltiplas coincidências recebidas, pode escolher a referência a comparar. Também pode manter pessoas distintas separadas, inclusive quando compartilham contato.
- A unificação mantém a pessoa principal, marca o identificador secundário como alias histórico e remapeia referências de processos, avaliações, admissões, vínculos, contatos, análises, pacotes de dados e relacionamento. Propostas, entrevistas e notas continuam apontando aos mesmos IDs de processos. Snapshots de formulários, instrumentos, ofertas e resultados antigos não são reescritos.
- Evidências/tags/modalidades são reunidas com preservação das fontes; campos principais e CV/portfólio são escolhidos pelo RH. Versões são ordenadas, com origem preservada. Respostas adicionais do novo formulário são conservadas no histórico ou no processo criado para a pessoa mantida separada.
- Dois vínculos locais ativos impedem a unificação até revisão RH; não há encerramento automático para acomodar o merge. Convites abertos dos dois registros são revogados. Revisões fechadas não podem ser executadas novamente; decisões conflitantes com alterações posteriores precisam de nova comparação.

A decisão continua humana. O arquivo/cadastro secundário não é apagado silenciosamente. Sua retenção e as referências históricas permanecem sujeitas à revisão de finalidade e eliminação RH.

## Arquivamento e novas oportunidades

Só processos encerrados ou formalizados podem ser arquivados. A operação retira o card da visão operacional e guarda data, autor, motivo e origem manual/automática. Não altera resultado, cadastro, contrato, acesso, proposta ou admissão. O filtro de arquivados permite consultar também ciclos anteriores, e a ficha mostra todos os processos da pessoa.

O RH configura arquivamento automático por idade de encerramento. A regra roda localmente ao abrir o módulo e após alterações; não é um serviço agendado com o navegador fechado. Registros legados sem data de encerramento utilizam a última atividade conhecida como referência conservadora. Vínculos ativos nunca são encerrados por arquivamento.

Uma nova oportunidade de currículo sem processo cria Entrada sem duplicar a pessoa; para processos encerrados/arquivados, cria novo ciclo conservando o anterior. Não substitui silenciosamente outra seleção operacional ativa. Contratações anteriores exigem Offboarding e elegibilidade revisada conforme as regras existentes.

## Match e importação

Match consulta toda a base elegível, inclusive pessoas sem processo atual. Exclui anonimizados/aliases, retenção vencida e ausência de interesse; permite filtrar disponibilidade e atualidade e ordenar primeiro talentos/atualizações mais recentes. Essas informações não comprovam competência nem alteram o percentual de evidências profissionais. A análise continua demonstrativa e exclusivamente apoiada nos requisitos/evidências manuais, sem seleção automática ou API de IA.

A interface de importação recebe **CSV/TSV UTF-8**, até 1 MB e 200 linhas, com exemplo fictício carregável/download. Para XLSX, exporte como CSV antes de simular. As duas origens iniciais representam os processos Pipefy apenas como nomes demonstrativos personalizáveis; não há consulta ao Pipefy.

O RH faz correspondência de campos, pré-visualiza linhas, verifica coincidências inclusive dentro da planilha, escolhe as linhas e confirma explicitamente o uso de dados fictícios. Só então a simulação cria exemplos locais no Banco, sem iniciar processos. Possíveis duplicidades ficam pendentes; não são unificadas. Erros de linhas selecionadas bloqueiam a transação sem alterações parciais. O ID do lote impede dupla submissão; o relatório conserva origem, arquivo, totais e resultado por linha. Dados não mapeados são ignorados por escolha explícita. Não executar esta simulação com planilhas reais.

## Compatibilidade, permissões e recuperação

O upgrade local `resumeVersion: 1` usa o mesmo namespace `recruitment-v1:${scope.key}`. Preserva a versão estrutural anterior e os dados existentes; não recria a base ao trocar de rota. Pessoas na antiga coluna Banco tornam-se talentos e seus processos são arquivados com o resultado e snapshots originais preservados. A conversão é idempotente. Restaurar exemplos exige confirmação e afeta só o Recrutamento desse escopo.

RH mantém a gestão privada do Banco, atualização, contatos, merge e importação. Diretoria continua gerencial/financeira; liderança continua apenas com designações técnicas. Novas estruturas privadas e motivos de arquivamento não são expostos nas projeções dos demais perfis. Rotas/formulários não concedem papéis ou acessos novos. Profissionais não acessam a gestão.

Sem sincronização entre contas, perfis, dispositivos ou abas simultâneas. Uma recuperação do deployment não desfaz automaticamente a atualização do IndexedDB. Conservar versões/snapshots, não substituir bancos locais silenciosamente por exemplos e não usar restauração global do Supabase.
