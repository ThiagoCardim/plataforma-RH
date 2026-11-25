# YouCon Academy — demonstração local

Implementação na rota `/youcon-academy`, categoria Desempenho. Não aplica migrations, não altera permissões remotas, não escreve no Supabase e não integra o portal operacional.

## Jornada disponível

- **Início:** banner configurável, progresso individual, continue aprendendo, recomendações por setor e curadoria em carrosséis.
- **Catálogo:** busca, categoria, tipo e setor; seis tipos de conteúdo, capas com gradientes/ícones ou upload local. Nenhuma imagem gerada por IA.
- **Trilhas de Aprendizagem:** mapas com sequência de referências ao catálogo, objetivo, competência, setor, cargo e vínculo. Adesão guarda a sequência da ocasião, sem impor carreira a PJ.
- **Agenda de Treinamentos:** próximos e realizados, Brasília, inscrição própria, registro gerencial de participantes, presença, materiais e gravação posterior. Sessão fechada preserva presença e documentos.
- **Meu Aprendizado:** versões inscritas, aulas, player nativo com controles/legendas no vídeo demonstrativo, blocos e questionários, evidências e pareceres.
- **Minhas Conquistas:** galeria individual, modelos personalizáveis, certificado/comprovante/registro interno ou nenhum documento. Download SVG e impressão demonstrativos.
- **Gestão Academy:** indicadores, gráficos clicáveis, filtros por data de inscrição/setor/pessoa/vínculo, histórico individual, propostas, publicação, evidências, licenças, investimentos, trilhas, categorias e configuração do banner.

O editor permite adicionar/reordenar módulos, aulas e blocos de texto, vídeo, imagem, apresentação, arquivo, link e questionário. Vídeo pode ser enviado localmente até 25 MB; arquivos/evidências até 10 MB e capa até 4 MB. Links externos são abertos explicitamente, sem iframe arbitrário. Apresentações/arquivos podem ser consultados ou baixados pelo componente já utilizado na plataforma.

## Acesso

A guarda de servidor usa `careerScope()` e `requirePermission("home.view")`, a identidade e organização reais autenticadas e os papéis existentes. Não existe seletor de perfil. A abertura do espaço de aprendizagem para profissionais/PJ é específica da Academy; não amplia o acesso a Colaboradores, análises financeiras ou outros módulos.

| Perfil                                         | Aprendizagem própria                                                | Autoria/curadoria                                                | Acompanhamento                                             | Financeiro e aprovação                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| RH/Diretoria com permissão gerencial existente | Conforme público do próprio vínculo                                 | Completa                                                         | Consolidado                                                | Completo; vedada validação da própria evidência                           |
| Liderança                                      | Conforme público autorizado                                         | Próprias propostas; publicar exige gestão                        | Apenas CLT/Estágio da equipe atribuída                     | Sem acesso                                                                |
| CLT/Estágio                                    | Conteúdos, trilhas e conquistas autorizados                         | Nenhuma                                                          | Próprio                                                    | Nenhum                                                                    |
| PJ                                             | Recursos pertinentes aos serviços e trilhas expressamente opcionais | Apenas quando possui papel funcional de liderança, com aprovação | Papel de liderança acompanha somente CLT/Estágio da equipe | Somente eventual papel gerencial já existente; não adquirido pelo vínculo |

Papel administrativo e vínculo contratual são dimensões distintas. Mesmo um RH PJ não pode inscrever sua própria conta em conteúdo destinado exclusivamente a empregados. A projeção entregue a líderes remove corpos de aulas, evidências, respostas e eventos individuais dos terceiros acompanhados; mantém metadados/progresso. Dados financeiros nunca entram na projeção de profissionais/líderes.

As verificações locais organizam a demonstração e não tornam IndexedDB ou JavaScript invioláveis. Autorização definitiva de comandos, arquivos e identidade de destinatários dependerá de implementação de servidor/RLS especificamente aprovada no futuro.

## Versionamento e integrações locais

- Curso mantém `draft`, `published` e versão. Editar uma publicação mantém a edição anterior visível até aprovação/publicação explícita. Inscrição por pessoa/conteúdo/versão é idempotente e copia um snapshot da edição utilizada.
- Conclusão e documento guardam título, carga horária e modelo utilizados. Arquivamento impede iniciar/continuar o recurso atual sem apagar histórico ou documentos já emitidos.
- Trilhas guardam publicação anterior durante edição. Adesões novas preservam a sequência escolhida; títulos dos recursos continuam resolvidos pelo ID canônico. Conteúdo arquivado pode ficar indisponível, sem apagar o progresso.
- Agenda guarda sessão por versão do treinamento ao vivo; inscrições novas somente na versão atual. Mudanças posteriores não reescrevem presença histórica. Sessões antigas ainda abertas devem ser encerradas pela gestão; não se reinscreve em versões antigas.
- Gravação exige sessão realizada/encerrada e ação gerencial. Preparar conteúdo permanente cria rascunho no **mesmo ID de curso**; nova aprovação/publicação é necessária. Sessão, inscrições e comprovantes anteriores preservam a versão ao vivo.
- Evidência externa/prática passa por RH/Diretoria; não pode ser autoaprovada. Complementação guarda a evidência anterior e o histórico dos pareceres, sem sobrescrever silenciosamente o envio.
- Referências a **Onboarding, PDI, cargo publicado do Plano de Carreira e Avaliação de Desempenho** guardam apenas ID do curso, destino, contexto, autor/data e organização. Widgets nesses quatro destinos abrem o catálogo. Não copiam aulas, não concluem etapas, não alteram avaliação, PDI ou orçamento e não geram promoção. Referências não atravessam contas/navegadores nesta etapa.
- Hall de Destaques permanece independente. Academy não emite reconhecimentos de desempenho, pontos ou elegibilidade a promoção.

## Cursos externos e licenças

Plataforma, fornecedor, link e instruções ficam no conteúdo; quantidade adquirida, investimento e vigência ficam em estrutura financeira separada. Dados são fictícios, não há compra, pagamento ou concessão de acesso real no fornecedor.

Atribuições ativas são únicas por pessoa/conteúdo, respeitam a capacidade, público e vigência. Liberação conserva o registro histórico. Não se reduz o total comprado abaixo das atribuições ativas. A vigência é conferida também ao abrir o recurso e ao carregar a projeção do aprendiz. URLs/orientações não aparecem a aprendizes sem licença ativa.

Não há campos de senha. URLs com credenciais e parâmetros sensíveis, scripts e instruções com pares `senha:`, `password=`, `token:` ou similares são rejeitadas. Isso não é um detector universal de segredos: nesta etapa devem ser usados exclusivamente exemplos, sem credenciais reais.

## Persistência e limites

Reutiliza IndexedDB `youcon-demo-v1`, store `demos`, com chaves:

- `academy-v1:${organização}:${usuário}:${papéis ordenados}:${vínculo}`;
- `academy-links-v1:${mesmo escopo}`.

Arquivos Blob são serializados/restaurados pela infraestrutura compartilhada. Não são enviados ao servidor. Restaurar exemplos exige confirmação e afeta somente a Academy da conta/organização/perfil atual; referências permanecem como histórico e podem indicar um conteúdo indisponível. Onboarding, Offboarding, Home Office, Carreira, PDI, Avaliação e Hall mantêm suas chaves próprias.

- Sem sincronização entre contas/dispositivos, notificações reais, integrações, pagamentos ou emissão oficial.
- Licenças e agenda usam data/hora do ambiente local; servidor autoritativo não foi implementado.
- Carga horária é declarada no catálogo; não mede horas assistidas/trabalhadas, jornada ou produtividade.
- Questionários corrigem localmente e suas respostas são inspecionáveis; não são exames seguros, certificações ou provas autoritativas de competência.
- Vídeo demonstrativo é um clipe local com tipografia/cor, sem IA, pessoas, áudio ou captura de tela. Upload definitivo, streaming seguro, legendas de vídeos enviados, emissão oficial e integrações externas ficam para etapa futura.
- Documentos visuais sempre exibem marca demonstrativa/sem validade oficial, mesmo com modelo personalizado.

## Preview

Preparação em branch de funcionalidade, sem merge. O push gera deployment Preview; conferir projeto, SHA, branch, target Preview e estado READY. Preservar proteção de login, sem links ou tokens de bypass. O alias fixo `https://youcon-people-preview.vercel.app` só muda após **aprovação manual explícita** desta versão. Antes disso, permanece apontando para a versão anterior. Nunca promover a produção.

Consulta de metadados Vercel não substitui teste funcional autenticado pelo usuário no candidato. Recuperação: manter/reapontar somente o alias Preview ao deployment anterior READY; não desfazer dados no Supabase. Dados locais ficam no navegador por origem; trocar domínio não transporta os exemplos editados.
