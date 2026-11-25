# Avaliação de Desempenho e Hall de Destaques

Demonstração local integrada, com dados exclusivamente fictícios. Rotas `/avaliacao-de-desempenho`, `/hall-de-destaques` e `/metas-dos-lideres`. O menu coloca Hall de Destaques imediatamente após Avaliação de Desempenho. Mantém Pessoas, jornadas, documentos, Home Office, Carreira, PDI e os controles de autenticação existentes.

## Avaliações e critérios

Sete abas gerenciais: Visão Geral, Desempenho Operacional, Desempenho Comportamental, Desempenho dos Setores, Desempenho das Lideranças, Modelos e Critérios, Histórico. Profissionais recebem somente visões próprias finalizadas/liberadas; liderança recebe sua equipe fictícia do próprio setor e não recebe o acompanhamento confidencial das lideranças.

RH cria, edita e duplica modelos, configura perguntas, dimensão, pesos, metas, unidade, sentido de cumprimento, escala, periodicidade, setor, função e vínculos. Diretoria acompanha os modelos; a edição destes e dos ciclos de avaliação é do RH. Modelos de liderança podem ser exclusivos de uma pessoa e combinar critérios comuns de gestão e específicos do setor.

Operacional usa apenas entregas, qualidade, prazos, complexidade e resultados. Para PJ, o título é **Indicadores de Entregas Contratuais**; não admite modelos culturais ou de gestão comportamental, nem dimensões de jornada/disciplinar. Marketing e Comercial possuem funções e indicadores diferentes dentro de Revenue. Os exemplos incluem Arquitetura, Engenharia, Aprovação, Interiores, Revenue e Operações de apoio, esta última preservando a consistência das pessoas fictícias já usadas no PDI/Carreira.

Comportamental é exclusivo de CLT/Estágio, com os valores Postura de Dono, Sede de Crescimento, Melhoria Contínua, Lealdade e Atitude. A escala inicial 1–5, pesos iguais e metas dos exemplos são **demonstrativos**, sem regra definitiva ou nota de corte. RH pode personalizá-los.

Cada avaliação copia o modelo completo e a vigência do ciclo. Editar um modelo cria nova versão e não reescreve avaliações existentes. Não é permitido duplicar tipo de avaliação/pessoa/ciclo nem alterar silenciosamente a vigência de um ciclo usado. Histórico preserva perguntas, metas, escala, pesos, respostas e eventos originais.

Rascunho → envio ao RH → validação ou ajustes → liberação manual pela gestão. Somente rascunhos/ajustes são editáveis. RH não aprova avaliação em benefício próprio ou de sua autoria. Validação não libera automaticamente ao profissional. Publicação interna de um resultado PJ não concede acesso à conta PJ; é um resultado contratual disponível à gestão e a avaliadores autorizados.

Respostas observadas exigem justificativa e referência de evidência; Não observado/Não aplicável exige explicação e sai do denominador. Todos não observados resultam em ausência de nota, apresentada como **Não observado**, sem nota zero. Não há classificação automática de improdutividade.

Cálculo demonstrativo: operacional normaliza realizado/meta (ou meta/realizado para indicadores em que menor é melhor), com teto visual/comparativo de 100%; zero em indicador menor-é-melhor representa expectativa atendida. A resposta bruta e sua meta continuam visíveis. Escalas normalizam entre mínimo/máximo configurados. A ponderação considera somente critérios observados. Não há limiar de mérito, eleição de vencedor ou progressão automática.

Dashboards filtram setor, função/serviço, ciclo e profissional. Mostram metas, cumprimento contextualizado, qualidade, prazos, complexidade, resultados, contribuição individual e evolução por ciclo. Não somam volumes absolutos nem criam ranking de produtividade entre atividades diferentes. Mudanças de critérios entre ciclos exigem interpretação humana da comparabilidade.

## Acompanhamento das lideranças e Metas dos Líderes

`/metas-dos-lideres` usa o mesmo componente, namespace de dados e registros de Desempenho das Lideranças; não mantém uma cópia paralela. Gestão exclusiva de RH/Diretoria, inclusive diário, evidências, feedbacks e acontecimentos.

Recorrências semanais, quinzenais, mensais e personalizadas em dias geram suas ocorrências automaticamente, com identificador determinístico por responsabilidade/data. A leitura é idempotente. O período é limitado tecnicamente a 366 dias por cadastro; pode-se criar outro período. Mensal preserva o dia original e ajusta meses curtos (31/jan → 28 ou 29/fev → 31/mar). Não existe cron remoto.

Ocorrências têm prazo, pendência, evidência, feedback, conclusão e histórico. Concluir exige evidência. Encerrar recorrência afeta somente o futuro: ocorrências canceladas ficam identificadas, não são recriadas e não entram como pendências na consolidação; registros passados e concluídos permanecem. Para mudar calendário, encerre a recorrência futura e cadastre outra versão, preservando o histórico.

Filtro mensal organiza o acompanhamento. A consolidação automática reúne ocorrências, prazos, evidências e diário do período da avaliação em um snapshot no rascunho, mediante ação da gestão. Atualizações posteriores podem ser consolidadas novamente. Não atribui notas, não valida nem publica. Diário e consolidação são removidos antes de serializar visões não gerenciais, inclusive a própria avaliação final de um líder.

## Conexões com PDI e Carreira

Avaliações validadas/publicadas podem ser vinculadas manualmente a um PDI existente da mesma pessoa ou a um Ciclo de Reconhecimento aberto. A interface carrega destinos locais já criados; quando ainda não há armazenamento, usa as listas fictícias iniciais dos módulos. Exige síntese escrita e bloqueia vínculo repetido da mesma fonte/destino.

A referência aparece no painel do PDI ou no card do ciclo de Carreira com autor, data, título e síntese. Não cria PDI, modifica ações, concede autoria ao RH, gera análise financeira, reserva orçamento ou promove alguém. Liderança só vincula ao PDI da equipe autorizada; somente gestão acessa os destinos financeiros. PJ pode ter referência contratual em ciclo de reconhecimento e não participa de PDI. PDI e Carreira mantêm seus próprios modelos e permissões.

`portal-contract.ts` declara apenas uma interface futura de leitura de evidências operacionais e seu contrato de dados. Nenhum adaptador é instanciado e não há URL, chave, requisição ou integração com o portal. Futura implementação precisará de autorização e validação de organização/identidade no servidor.

## Hall de Destaques

Abas: Destaques do Mês, Ranking Semestral, Minhas Conquistas, Hall da Fama, Regulamento e Gerenciar Reconhecimentos (gestão). Visual preto/laranja/dourado, retratos fictícios gerados por IA, cards, pódios por categoria, troféus, medalhas, selos e galeria individual de conquistas publicadas.

Categorias iniciais: Arquitetura, Engenharia, Aprovação, Interiores, Revenue, Cultural e Liderança. Não existe categoria operacional geral; uma nova categoria operacional exige setor. Elegibilidade setorial inclui CLT, Estágio e PJ por excelência das entregas. Cultural e os critérios gerenciais da categoria Liderança dos exemplos são exclusivos de CLT/Estágio; lideranças têm categoria independente. Não aplicar critérios culturais ou de jornada a PJ. Premiações financeiras PJ exigem tratamento contratual próprio; nenhum pagamento é implementado.

RH/Diretoria analisam candidatos com avaliações validadas/publicadas, selecionam a pessoa elegível e preparam a divulgação. Não há seleção por nota de corte, votação automática ou cópia de notas para o texto público. É possível documentar reconhecimento manual sem fonte de avaliação. A preparação tem fotografia local (JPG/PNG/WebP/AVIF até 4 MB), mensagem, frase, categoria, campanha, mês e ordem de apresentação.

Preparação privada → validação humana do vencedor → confirmação explícita de publicação. Não valida reconhecimento em benefício próprio, não publica mês futuro, não duplica categoria/campanha/mês e não edita reconhecimento já validado/publicado. Notas, resultados negativos, candidatos, referências de avaliações, autores internos e histórico privado não são enviados ao Hall não gerencial. Textos públicos são redigidos e revisados pela gestão; o sistema não copia automaticamente a fundamentação interna.

Reconhecimentos guardam cópias da categoria, campanha, pontos e regulamento de origem (para novos registros preparados nesta versão). Alterações de configuração não reescrevem reconhecimentos existentes. Regulamentos têm versões publicadas e rascunhos. Pódios contam somente reconhecimentos publicados da categoria e campanha selecionadas; nenhum ranking mistura setores ou usa notas individuais de avaliação.

Campanhas configuram semestre/ano, nome, premiação demonstrativa, pontos e desempate: empate compartilhado, reconhecimento mais recente ou prioridade manual do RH. A prioridade manual é definida por nomes e reordenação, aplicada somente a empatados da mesma categoria. Empates não resolvidos são compartilhados. Valores iniciais são ilustrativos, não regras finais. Configuração de desempate da campanha orienta o ranking derivado; alterações são atos explícitos da gestão.

Na virada do semestre, a leitura prepara uma campanha vazia se não houver uma configurada para o período. Não cria vencedor, não publica e não apaga o semestre anterior. A seleção padrão privilegia o semestre corrente, inclusive quando o RH preparou uma campanha com outro identificador. Hall da Fama e os filtros mantêm os históricos anteriores.

## Cerimônia

Somente gestão prepara e inicia a apresentação. Seleciona mês/campanha e decide incluir rascunhos/validados na **prévia privada**, ou apresentar somente resultados publicados. A ordem vem da preparação. Há revelação do primeiro/próximo destaque, suspense, retrato, mensagem, frase, selo, efeitos luminosos, confetes e reinício. Nenhuma ação da cerimônia publica resultados.

Apresentação ocupa a janela e oferece tela cheia nativa, com fallback ao painel imersivo quando a API não está disponível. Escape fecha, o foco fica no diálogo e retorna ao acionador. `prefers-reduced-motion` desativa animações/confetes e remove espera de suspense. Não usa som automático nem serviços externos.

## Permissões

| Ação                                                | RH                          | Diretoria                        | Liderança CLT/Estágio                         | Profissional CLT/Estágio   | PJ sem papel administrativo |
| --------------------------------------------------- | --------------------------- | -------------------------------- | --------------------------------------------- | -------------------------- | --------------------------- |
| Visão consolidada de avaliações                     | Sim                         | Sim                              | Equipe atribuída do próprio setor             | Somente próprias liberadas | Não                         |
| Criar/editar avaliação                              | No escopo, sem avaliar a si | No escopo, sem avaliar a si      | Equipe/setor, sem lideranças ou autoavaliação | Não                        | Não                         |
| Modelos e ciclos de avaliação                       | Configura                   | Consulta                         | Consulta modelos elegíveis                    | Não                        | Não                         |
| Validação do RH                                     | Sim, sem autoaprovação      | Só se possuir papel RH existente | Não                                           | Não                        | Não                         |
| Liberação de avaliação validada                     | Sim                         | Sim                              | Não                                           | Não                        | Não                         |
| Diário, metas e consolidação de lideranças          | Sim                         | Sim                              | Não                                           | Não                        | Não                         |
| Gestão de categorias/campanhas/vencedores/cerimônia | Sim                         | Sim                              | Não                                           | Não                        | Não                         |
| Hall, pódios, regulamento e conquistas publicadas   | Sim                         | Sim                              | Sim                                           | Sim                        | Sim                         |

Reutiliza identidade, organização, papéis e vínculo da autenticação existente, com `home.view`. Gestão exige `people.management.view` e papel RH/Diretoria. Nenhum papel é selecionado pelo cliente. Um titular com vínculo PJ e papel administrativo **já existente** mantém sua função de RH/Diretoria; isso não o insere em avaliações culturais de empregados. Liderança PJ sem papel administrativo não acessa Avaliação/Metas. Não altera a exceção anterior de supervisão de PDI, nem dá acesso a outros módulos.

Pessoas/equipes/setores das demonstrações são fictícios. A relação da equipe do líder é gerada para testar as restrições, não representa atribuição real extraída do banco. O servidor projeta os dados antes da serialização, e a projeção é reaplicada na leitura local. O Hall não gerencial tem projeção e cache separados, sem avaliações internas, evitando tanto vazamento de dados quanto perda de avaliações ao navegar entre telas.

## Persistência e limites

IndexedDB existente `youcon-demo-v1`, store `demos`. Chaves: `performance-hall-v1:<escopo>` (Avaliação, Metas e Hall gerencial), `published-hall-v1:<escopo>` (Hall não gerencial) e `evaluation-links-v1:<escopo>` (referências locais ao desenvolvimento). Escopo contém organização, usuário, papéis ordenados e vínculo. Não mistura estados das jornadas ou documentos, não sincroniza entre contas/dispositivos/perfis e não se conecta ao Supabase para persistir estes módulos.

Fotos Blob são serializadas e restauradas pela infraestrutura existente, com avisos de quota/indisponibilidade. Restaurar exemplos exige confirmação e afeta a base integrada desta conta, preservando referências já enviadas ao PDI/Carreira. Essas referências são snapshots históricos, não sincronização ativa ou aprovação de destino.

Não inserir dados reais. Relógio e autoria de eventos são demonstrativos; armazenamento local não é auditoria inviolável nem autorização de banco. Não há scheduler, integração com portal/ponto/folha/WhatsApp, monitoramento, mensagem, pagamento, promoção, migration ou escrita remota. Login e proteções de Preview permanecem existentes.

## Testes e homologação

Ver `VALIDACAO.md`. Testes de navegador usam app Next.js completo, Chromium e Auth/Data API sintéticos exclusivamente em loopback. Nenhuma fixture remota ou conta real é usada.

Fluxo desta entrega: concluir checks → commit/push de feature branch → Preview READY do commit correto, com proteção mantida → apresentar para aprovação manual → somente após autorização, apontar `youcon-people-preview.vercel.app` ao deployment aprovado. Não promover a produção, não fazer merge e não usar links de bypass. O link fixo permanece na versão anterior durante a preparação.
