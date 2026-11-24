# Plano de Carreira e PDI — demonstração local

Rotas: `/plano-de-carreira` em Pessoas e `/pdi` como subaba independente em Desempenho. Sem migrations, APIs de escrita, alterações de Auth/RLS/grants ou integração de folha/contratos. Mantém autenticação e organizações existentes.

## Experiência

RH/Diretoria têm sete abas administrativas: Visão Geral, Trilhas de Carreira, Cargos e Competências, Faixas Salariais, Ciclos de Reconhecimento, Movimentações e Simulações, Diretrizes. A visão geral mostra distribuição cadastral por cargo, nível e setor; indicadores financeiros e análises são confidenciais.

O mapa em Y tem zoom, caminhos técnicos e de liderança, cargo atual destacado e cards que abrem responsabilidades, requisitos e competências expansíveis. Setores, cargos, nomes/ordens de níveis, ligações, competências e publicação são personalizáveis por formulário. Ligações exigem setor igual e nível de origem inferior; alterações não podem quebrar descendentes ou ocultar cargos ocupados/origens publicadas. Não há recomendação automática, previsão, solicitação ou indicação de promoção.

Profissionais CLT e estagiários consultam mapa e competências publicados, histórico próprio, diretrizes versionadas, resultados autorizados pelo RH e link para o próprio PDI. Publicações de reconhecimentos exigem efetivação prévia e consentimento editorial explícito do RH. Valores privados e fundamentos de mérito não são copiados para o conteúdo público. O RH redige o texto público e é responsável por sua revisão editorial.

PJs aparecem exclusivamente nas análises contratuais e respectivas referências financeiras. Não são participantes de trilhas/históricos de empregados nem de PDI. Um papel **já existente** de liderança, inclusive quando seu titular é PJ, mantém somente a responsabilidade funcional de acompanhar PDIs de CLT/estagiários da equipe; não recebe PDI próprio ou carreira de empregado. RH/Diretoria conservam a administração conforme seus papéis, independentemente do próprio vínculo. Nenhum papel é concedido por este módulo.

## Matriz de acesso

| Operação                                                 | RH                                    | Diretoria                          | Liderança                                      | Profissional CLT/estágio | PJ sem papel gerencial |
| -------------------------------------------------------- | ------------------------------------- | ---------------------------------- | ---------------------------------------------- | ------------------------ | ---------------------- |
| Administrar mapa, cargos, faixas, ciclos e diretrizes    | Sim                                   | Sim                                | Não                                            | Não                      | Não                    |
| Consultar finanças/análises confidenciais                | Sim                                   | Sim                                | Não                                            | Não                      | Não                    |
| Preparar/editar/enviar análise                           | Sim                                   | Não                                | Não                                            | Não                      | Não                    |
| Aprovar/rejeitar/pedir ajustes/cancelar reserva          | Não, salvo papel Diretoria existente  | Sim, sem autoaprovação             | Não                                            | Não                      | Não                    |
| Efetivar simulação local aprovada                        | Sim                                   | Não, salvo papel RH existente      | Não                                            | Não                      | Não                    |
| Autorizar publicação de resultado/reconhecimento         | Sim                                   | Não, salvo papel RH existente      | Não                                            | Não                      | Não                    |
| Consultar mapa/competências públicos e histórico próprio | Sim                                   | Sim                                | Próprios, se CLT/estágio                       | Próprios                 | Não                    |
| Criar e editar estrutura do PDI                          | Só com papel de liderança e equipe    | Só com papel de liderança e equipe | Equipe CLT/estágio, nunca próprio              | Não                      | Não                    |
| Aprovar/publicar estrutura do PDI e configurar ciclos    | Sim, sem aprovar próprio PDI/proposta | Monitoramento                      | Não                                            | Não                      | Não                    |
| Monitorar PDIs                                           | Geral                                 | Geral                              | Equipe e próprio aprovado, se elegível         | Próprio aprovado         | Não                    |
| Registrar progresso/evidências                           | Próprio aprovado, se elegível         | Próprio aprovado, se elegível      | Equipe sob responsabilidade e próprio elegível | Próprio aprovado         | Não                    |
| Feedback no PDI                                          | Monitorado                            | Próprio aprovado, se elegível      | Equipe/próprio elegível                        | Próprio aprovado         | Não                    |

Identidade, organização, contrato e papéis são derivados no servidor do acesso autenticado existente. `home.view` é obrigatório; administração exige `people.management.view` e papel `hr` ou `director`. Formulários não escolhem usuário autenticado, organização ou papel. Liderança não recebe finanças nem consegue abrir uma visão administrativa pela URL.

A projeção de servidor remove **o objeto financeiro inteiro** para não administradores, antes da serialização RSC. O perfil pessoal não contém salário. A projeção é reaplicada na leitura do IndexedDB. PDI tem modelo e persistência independentes, sem importação de informações financeiras. Os comandos também validam organização, papel, pessoa e escopo da equipe.

## Reconhecimento e sustentabilidade

CLT: mérito, promoção ou reajuste salarial. Estágio: revisão de bolsa. PJ: honorários. Apenas RH prepara análises; Diretoria decide com parecer, sem aprovar análise de sua autoria ou em benefício próprio. Uma pessoa não pode ter duas análises abertas simultâneas. Fundamentos de mérito são obrigatórios para envio; a data de efeito deve pertencer ao ciclo.

Os valores monetários são centavos inteiros. Para cada remuneração bruta mensal:

`custo mensal = bruto + arredondar(bruto × encargos / 100) + arredondar(bruto × provisões / 100)`.

`impacto mensal = custo proposto − custo atual`.

`impacto anual = impacto mensal × 12`.

`reserva do ciclo = impacto mensal × horizonte explícito em meses`.

Encargos e provisões são parâmetros **puramente ilustrativos**, distintos por vínculo e editáveis. Provisões são equivalentes mensais; não são somadas novamente ao anual. Não são uma recomendação legal/contábil. O horizonte é manual e transparente; a demonstração não infere calendário de folha, proporcionalidade de meses, tributos, convenções ou custos reais. Valores negativos, inválidos e fora do limite seguro são rejeitados.

Cada análise guarda remuneração atual/proposta, parâmetros e horizonte próprios. Alterar parâmetros padrão não reprecifica reservas anteriores. Ciclos referenciados não podem ter período/horizonte reescrito. Valores mínimos/de referência/máximos das faixas são brutos e ordenados, com vínculo e cargo compatíveis; perfis PJ são separados dos cargos de empregados.

Indicadores de receita/custos com meta e realizado e saldo operacional ajudam a análise humana. Não estabelecem gatilhos de promoção ou regras financeiras definitivas. Orçamento disponível = autorizado − reservas de análises aprovadas/efetivadas. Rascunhos e análises em revisão não comprometem; cancelamento aprovado libera; não é possível aprovar acima do disponível ou reduzir orçamento abaixo do comprometido.

Aprovação reserva orçamento e não muda cargo/remuneração. RH efetiva manualmente depois da data de efeito, com confirmação expressa de que o efeito é **somente local**. Repetir efetivação é bloqueado. Não modifica Base Central, vínculo, bolsa, contrato, folha ou conta reais. Publicação é uma ação separada. PJs não geram histórico de empregado ou publicação de reconhecimento nessa experiência.

## PDI

Ciclos têm nome, vigência e estado configuráveis pelo RH; cada plano guarda sua cópia de origem. A liderança seleciona exclusivamente CLT/estagiário da equipe e ciclo ativo. Um plano ativo por pessoa/ciclo. Estrutura contém título, objetivo, múltiplas ações e prazos dentro da vigência; pode ser salva como rascunho ou enviada ao RH.

Somente após aprovação do RH a estrutura é publicada ao profissional. Alterações estruturais geram nova revisão; a versão publicada continua acessível até substituição aprovada. Progresso/evidências de ações preservadas não se perdem se houver atividade enquanto uma versão está em revisão. Versões aprovadas preservam seu conteúdo original.

Ações têm conclusão manual, evidências descritivas, links HTTP(S) e arquivos locais até 10 MB. Arquivos são convertidos em Blob no IndexedDB e retomados após recarga. Tipos não seguros são disponibilizados como download binário. Feedbacks, autoria/data, prazos, histórico e versões são consultáveis em painel individual.

O percentual representa **ações do PDI concluídas**, nunca proximidade de promoção. Concluir todas as ações não efetiva carreira, não aprova reconhecimento e não conclui o plano automaticamente; a liderança conclui o PDI explicitamente. RH monitora e dá feedback; Diretoria acompanha em leitura e pode interagir com seu próprio plano elegível. Não assumem autoria operacional da liderança sem seu papel existente.

## Persistência e limites

Reutiliza `useLocalDemo` e IndexedDB `youcon-demo-v1`, store `demos`, com chaves `career-v1:admin|public:<organização>:<usuário>:<papéis ordenados>:<vínculo>` e `pdi-v1:<mesmo escopo>`. Não mistura Onboarding, Offboarding, documentos ou Home Office. Restaurar demonstração exige confirmação e afeta somente o módulo atual.

Todos os profissionais, cargos, salários, indicadores e relações de equipe são fictícios. Uma pessoa fictícia é ligada à sessão para representar a experiência individual; isso não altera o cadastro real. Não é uma leitura da carreira ou equipe reais.

Persistência é por navegador, conta, organização e perfil: não existe sincronização entre contas, dispositivos ou perfis. Os exemplos incluem estágios já preparados para RH, Diretoria, líderes e profissionais testarem separadamente. Uma análise enviada no navegador do RH não aparece na sessão isolada da Diretoria. Alterações administrativas no mapa não são distribuídas aos outros usuários; integração futura exigirá persistência/autorização de servidor.

O armazenamento e os históricos locais são demonstrativos, não uma fronteira de segurança de banco nem auditoria inviolável. Não inserir dados reais/confidenciais. Há avisos de indisponibilidade/quota do navegador. O relógio é local. Nenhum aviso, acesso, pagamento, promoção, desligamento ou revogação real é executado. Não há seletor de perfil, bypass de login ou monitoramento de dispositivos.

## Verificação

`npm run lint`, `npm run typecheck`, `npm test` e build Next.js. A suíte de domínio cobre projeções e exclusão PJ, organização/equipe, hierarquia, faixas, centavos/arredondamento, reservas e snapshots, aprovação sem autoaprovação, execução manual, autorização de publicação, PDI com nova revisão sem perda de progresso, evidências, ciclos e ausência de progressão automática.

`tests/browser/career-pdi.mjs`: app Next.js completo, Chromium nativo, Auth/Data API sintética **somente em loopback**; GETs apenas, nenhum contato com Supabase hospedado. Exercita os sete contextos RH, Diretoria, liderança CLT/PJ e profissional CLT/estágio/PJ, mapa por teclado, criação/publicação e recarga de cargos, simulações por vínculo, reserva da Diretoria, efetivação/publicação RH, diretrizes, criação/revisão/publicação de PDI, evidência com arquivo após recarga, progresso/feedback próprio e layouts desktop/mobile.

Execução: build com `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3104 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_loopback npm run build`; depois `RUN_BUILT_APP=1 node tests/browser/career-pdi.mjs`. Usa a instalação local de Playwright descrita no cabeçalho dos testes existentes, sem adicionar dependência ao produto. Capturas de teste em `work/career-review/` (não versionadas).

Ver relatório `VALIDACAO.md` para resultados desta entrega. Preview deve ser do mesmo commit testado, estado READY, mantendo proteção por login e alterando somente o alias fixo; sem promover deployment para produção.
