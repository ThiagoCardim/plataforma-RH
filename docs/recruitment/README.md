# Recrutamento e Seleção — demonstração ATS local

Continuidade sobre `218e0e8` (Cultura), branch de funcionalidade, sem merge. Não altera o Supabase compartilhado, portal operacional, Auth, RLS, grants, Storage ou produção. Não utiliza APIs de IA, serviços de envio, rastreamento, processamento remoto de currículos ou novas imagens geradas por IA.

## Navegação

Categoria independente **Recrutamento**, com seis rotas protegidas:

| Destino              | Rota                        | Acesso                                                          |
| -------------------- | --------------------------- | --------------------------------------------------------------- |
| Visão Geral          | `/recrutamento/visao-geral` | RH; recortes gerenciais Diretoria; recorte designado liderança  |
| Gestão de Vagas      | `/recrutamento/vagas`       | RH; acompanhamento Diretoria; candidaturas designadas liderança |
| Banco de Talentos    | `/recrutamento/talentos`    | RH                                                              |
| YouCon Match         | `/recrutamento/match`       | RH                                                              |
| Modelos e Avaliações | `/recrutamento/modelos`     | RH                                                              |
| Página de Carreiras  | `/recrutamento/carreiras`   | RH, como demonstração protegida                                 |

`recruitmentScope` utiliza `careerScope()`/`home.view`, identidade, organização, vínculo e papéis autenticados existentes. Gestão RH/Diretoria continua exigindo a permissão gerencial já existente. Profissionais sem atribuição funcional não acessam as rotas, inclusive a prévia de carreiras. Não existe seletor de perfil ou bypass de autenticação. PJ que já tenha papel RH ou liderança conserva a atribuição funcional desse papel; o vínculo não concede gestão.

## Funcionalidades

- Dashboard com vagas, candidaturas, passagens e conversão por etapa, origens, propostas, entrevistas, contratações, tempo de contratação e custo cadastrado por contratação. Recortes por vaga, setor, vínculo, responsável e período de cadastro das candidaturas. Gráfico de funil permite consultar as candidaturas do recorte.
- Vagas: cadastro, edição, cópia, publicação local, pausa e encerramento; cargo, setor, vínculo, posições, atividades, requisitos, condições/benefícios, orçamento e previsão. Kanban por vaga, drag/drop, seletor acessível de etapa, lista, pesquisa, campos e checklists por etapa, prazos, responsáveis, tags e histórico.
- Banco: ficha profissional, CV/portfólio locais, importação demonstrativa, possível duplicidade por e-mail/telefone/nome, várias candidaturas por pessoa, origem/indicação, entrevistas, notas e pareceres, filtros combináveis e consultas salvas. Importar significa anexar o arquivo, não OCR ou extração automática de currículo.
- Formulários: campos ordenáveis, tipos de resposta, obrigatoriedade, perguntas condicionais com dependência de campos anteriores, prévia, cor e confirmação; formulário geral e snapshot específico de cada vaga.
- Modelos: processos, DISC, Temperamentos, entrevistas, técnica, prática, proposta, mensagens e motivos de encerramento; criar/editar/duplicar, perguntas e conteúdo, versões preservadas no uso. Modelos de processo copiam etapas aprovadas para edição de cada vaga.
- Instrumentos: link individual protegido, perguntas e respostas fictícias, histórico de versão do instrumento, respostas somente RH. Não há diagnóstico psicológico, cálculo de personalidade validado, corte definitivo ou distribuição externa de links.
- Propostas: decisão humana RH, rascunho, registro de envio/aceite/recusa **simulados**, exceção financeira pela Diretoria, confirmação explícita de formalização e preparação de dados autorizados para admissão.
- Página de Carreiras: apresentação e cor editáveis, referência à Cultura existente, oportunidades listadas/exclusivas, filtros, detalhes, formulário e Banco de Talentos. É uma **prévia autenticada**, sem publicação aberta ou recebimento de candidaturas reais.
- Automações: editor de gatilhos/condições/ações, ativação, desativação e log local. Nova candidatura já cria um card por comando explícito de inscrição; movimentação utiliza checklists da etapa; entrevista cria registro no calendário local; instrumento pendente gera registro de notificação local; aprovação RH pode preparar rascunho de proposta incompleto; aceite registra intenção de preparar admissão. Nenhuma regra envia mensagens, decide seleção ou formaliza contratação.

## Match — explicável e exclusivamente demonstrativo

Motor de regras local sobre **evidências profissionais estruturadas**, informadas ficticiamente pelo RH. Não lê semanticamente arquivos, não chama modelos de IA, não faz OCR, não valida autenticidade de documentos e não utiliza idade, gênero, raça, religião, deficiência, aparência, estado civil ou outras características pessoais protegidas como dimensões de classificação.

As dimensões permitidas são Competências, Softwares, Formação, Experiência, Disponibilidade e Modalidade. Critérios, requisitos obrigatórios/desejáveis e pesos são personalizáveis; os números iniciais são apenas exemplos e não regras definitivas. Termos explicitamente protegidos/irrelevantes são recusados no critério. A curadoria humana continua necessária: o filtro de termos não substitui avaliação da pertinência profissional.

Cada requisito informa:

1. **Comprovado na simulação:** há evidência estruturada documentada, com fonte;
2. **Não atendido:** há declaração explícita de não atendimento;
3. **Não informado:** faltam dados ou as fontes se contradizem; não é ausência de competência.

O percentual demonstrativo considera pesos dos requisitos documentados; a **cobertura documental** é mostrada separadamente. Sem informação suficiente, o percentual é indefinido. Ausência de requisito obrigatório não reprova ou movimenta ninguém. Não comparar percentuais sem considerar cobertura, contexto e revisão utilizada.

Análises individuais/em lote guardam snapshot, data e revisão da vaga; comparação lado a lado exige a revisão atual. Resumo e perguntas são construídos a partir dos dados fictícios e dos requisitos não esclarecidos. A busca em linguagem natural é uma **simulação por termos**, não compreensão linguística de um LLM. Nenhuma análise altera candidaturas, propostas ou decisões RH.

## Privacidade e permissões

| Perfil               | Candidatos e notas                                                    | Perfil / Match                                                 | Orçamento / proposta                    | Decisão                                              |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| RH                   | Gestão completa, designação e compartilhamento explícito              | Completo, instrumentos restritos                               | Cadastro e preparação; solicita exceção | Continuidade/encerramento e formalização             |
| Diretoria            | Identificadores gerenciais sem identidade pessoal, notas ou respostas | Sem acesso                                                     | Visão financeira e revisão de exceções  | Não decide contratação; não aprova a própria exceção |
| Liderança            | Somente candidatos designados; CV/respostas apenas se RH compartilhar | Sem DISC, Temperamentos, análises Match ou notas confidenciais | Sem acesso                              | Registra somente parecer técnico designado           |
| Demais profissionais | Sem gestão                                                            | Sem acesso                                                     | Sem acesso                              | Nenhuma                                              |

Projeções removem informação privada **antes** do envio aos componentes. Não se confia apenas em esconder botões. Contratos e dados pessoais de candidatos não substituem identidade/organização do ator autenticado. A designação local usa um identificador demonstrativo de liderança e não cria conta, grant ou papel remoto.

Finalidade, versão de finalidade e retenção demonstrativa são configuráveis pelo RH, sem estabelecer base legal definitiva. Cadastros guardam o prazo e a finalidade vigentes na coleta simulada; editar a configuração não muda silenciosamente os anteriores. O banco destaca prazos vencidos para revisão humana, sem exclusão automática.

Anonimização local confirmada remove nome/contato, CV, portfólio, evidências, notas, questionários, análises, respostas, condições identificáveis de propostas e dados dos pacotes de admissão no ATS. Metadados anônimos de processos e custos permanecem. **Não** remove automaticamente cópias autorizadas já criadas no Onboarding, outros navegadores, contas ou backups. Não equivale a atendimento LGPD definitivo; o fluxo de exclusão entre bases precisa de governança futura.

## Integridade e fluxo financeiro

- Candidato é canônico no banco; candidatura é única por candidato/vaga. Reenvio com mesmo e-mail pela página protegida reutiliza a pessoa, sem mesclar silenciosamente dados diferentes. Cadastro manual aponta possíveis duplicidades para revisão humana.
- Etapas ocupadas por candidatura ativa não podem desaparecer. Candidaturas mantêm snapshots de etapas, formulário e respostas. Mudanças futuras não reescrevem critérios antigos; novos campos/etapas aplicam-se ao contexto correspondente.
- Avançar exige os campos visíveis e checklist obrigatórios da etapa. Retornar preserva histórico e exige motivo. Passagens são registradas explicitamente, sem inferir conversão pela coluna atual.
- Aprovação RH não contrata nem movimenta automaticamente. Rascunho automatizado de proposta tem valor incompleto e precisa de revisão RH antes do envio simulado.
- Valor acima do orçamento exige exceção aprovada pela Diretoria para a candidatura e valor exatos. Não há autoaprovação. Proposta aceita não basta: formalização exige RH, confirmação explícita, posição disponível e cobertura orçamentária.
- Formalização é idempotente e exclusivamente local. Não cria pessoa real, vínculo, usuário Auth, conta, salário ou pagamento.

## Integrações e reaproveitamento autorizado

- **Indicação:** origem e referência de indicação preservadas na ficha; interface preparada para integração futura com o programa existente, sem copiar cadastros reais de indicadores.
- **Base Central / admissão:** após formalização RH, pacote canônico por candidatura com campos autorizados (nome, e-mail, telefone, cidade), autor e organização. O pacote é preparado, sem gravar na Base Central ou em sistemas contratuais.
- **Onboarding:** o RH encontra as admissões preparadas no módulo existente e pode iniciar um processo fictício mediante ação explícita. Reutiliza nome autorizado e metadados da vaga, seleciona modelos compatíveis e impede duplicidade pela referência canônica. O usuário do processo é marcado `unlinked`, sem criar associação de conta ou conceder acesso. Não copia CV, DISC, notas, contato sem suporte no destino ou dados financeiros.
- **Calendário:** eventos locais de entrevista no ATS, sem convites, Google Calendar ou integração externa.
- **Dashboard Gerencial:** indicadores e estruturas gerenciais disponíveis na Visão Geral do ATS para futura agregação. O dashboard antigo não recebe uma integração remota ou dados pessoais automaticamente.

## Armazenamento, limites e Preview

IndexedDB existente `youcon-demo-v1`, store `demos`, chave própria `recruitment-v1:${organização}:${usuário}:${papéis ordenados}:${vínculo}`. Arquivos Blob são serializados/restaurados localmente. Não há sincronização entre contas, dispositivos ou abas abertas ao mesmo tempo. A ação confirmada de restaurar exemplos afeta somente esse namespace; Onboarding mantém sua chave e os processos já copiados.

Autorizações e logs locais demonstram os fluxos; não tornam JavaScript/IndexedDB invioláveis, nem fornecem auditoria autoritativa. Horários, prazos, retenção, licenças de acesso e arquivos precisam de validação de servidor em uma etapa futura aprovada. Não utilizar currículos, dados pessoais ou candidaturas reais.

Push da branch gera somente deployment Preview. Conferir projeto, SHA, branch, target Preview e estado READY, preservando proteção por login. Link fixo `https://youcon-people-preview.vercel.app` só é atualizado após **aprovação manual explícita desta versão**. Não usar URLs de bypass, fazer merge ou promover produção. Os links exclusivos de vagas/instrumentos são referências internas da aplicação autenticada, não bypass de login.

Recuperação: manter o deployment anterior READY enquanto o candidato é revisado; uma eventual troca autorizada pode ser revertida reapontando apenas o alias Preview ao deployment anterior. Não há restauração global do Supabase, alteração de outra aplicação ou rollback de produção.
