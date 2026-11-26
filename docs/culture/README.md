# Cultura YouCon — interface institucional e curadoria local

Rota `/cultura`, categoria Políticas. Continuidade sobre `7fe4217` (Academy), sem reiniciar módulos existentes, sem merge e sem escrita em Supabase, Auth, RLS, Storage, portal operacional ou produção.

## Conteúdo institucional e fonte

**O Manual de Cultura mencionado no pedido não está nos anexos disponíveis ou no repositório.** A interface utiliza exclusivamente as informações confirmadas no pedido: banner, nomes dos valores, seus dois grupos, nomes Titã/Hero/Olimpo e objetivo de 1.000 novas construções até 2030. Não se presumiu avanço atual, números financeiros, datas históricas, identidade/quantidade real de fundadores, missão, visão, propósito, cartas, rituais, relatos ou fotografias institucionais.

As áreas dependentes do manual apresentam indicações de preenchimento/curadoria. Os dois espaços iniciais para cartas são modelos editáveis; não identificam ou afirmam quem são os fundadores. Histórias e timeline não possuem relatos ou marcos fictícios apresentados como reais. A jornada mostra um **objetivo**, nunca um resultado realizado; o progresso só aparece após cadastro explícito da gestão.

Não foram geradas imagens por IA. Capas são elementos CSS/ícones; espaços de fotografias reais aguardam upload. O único novo arquivo público é `public/demo/culture/manual-demo.pdf`, um PDF mínimo explicitamente fictício, sem conteúdo institucional, para testar visualização, download e versões. O clipe usado no teste de vídeo já existia na Academy e não retrata a empresa.

Para finalizar a curadoria institucional é necessário disponibilizar o manual oficial, fotografias/cartas autorizadas e os fatos históricos aprovados. A funcionalidade pode ser testada integralmente antes disso.

## Interface

- **Nossa Cultura:** apresentação em formato landing page, banner, âncoras de navegação, pilares, cartas expansíveis, valores interativos nos dois grupos, limites, rituais/mantras/grito/pose, metas, jornada com contador de objetivo, timeline, galeria, histórias e Destaque Cultural.
- **Manual de Cultura:** capítulos, PDF local com visualização/download, ciência por versão, histórico pessoal e acesso pela própria jornada de Onboarding.
- **Gerenciar Cultura:** RH/Diretoria editam banner, seções, títulos, descrições, temas, público, cards/cartas, grupos de valores, datas, metas/avanço, fotos, blocos e capítulos/PDF. Permite criar/remover/ocultar/reordenar seções, cards e capítulos; salvar rascunho, prévia editorial, publicação comentada, consulta histórica e recuperação como novo rascunho.

O editor de blocos é **o mesmo DocumentEditor de Políticas e Compliance**, com opções `blocksOnly` e `allowVideo` utilizadas nesta apresentação. A configuração padrão de DocumentEditor permanece inalterada para documentos existentes. Cultura oferece título, texto, lista, tabela, imagem, arquivo, link e vídeo MP4/WebM com legenda VTT opcional e texto de transcrição. Os blocos podem ser intercalados, reordenados, substituídos e removidos.

Links HTTP(S) são abertos explicitamente, sem iframe remoto arbitrário. Fotografias usam formatos raster; PDFs do manual exigem MIME/extensão PDF e verificação do cabeçalho no upload. Vídeo é local até 25 MB; PDF/arquivos comuns até 10 MB; fotografias de banner/cards até 4 MB e legendas até 1 MB. O armazenamento definitivo de mídia e a curadoria de acessibilidade dos vídeos reais ficam para etapa posterior.

## Acesso

Identidade, organização, vínculo e papéis derivam de `careerScope()` e da guarda existente `requirePermission("home.view")`. Nenhum seletor de perfil, bypass ou concessão remota foi introduzido. O novo link Cultura aparece aos leitores deste módulo; as demais guardas permanecem preservadas.

| Perfil                                         | Nossa Cultura                                                            | Manual e ciência                                                    | Gerenciar                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| RH/Diretoria com permissão gerencial existente | Público do próprio vínculo; prévia editorial privada separada            | Próprio registro se CLT/Estágio                                     | Completo                                                                                        |
| CLT/Estágio, incluindo liderança               | Apenas publicação atual, seções visíveis e autorizadas                   | Leitura e ciência própria por versão                                | Não                                                                                             |
| PJ                                             | Apresentação institucional e seções expressamente pertinentes à parceria | Sem ciência/compromissos de empregados e sem o manual de empregados | Somente se já possuir papel administrativo RH/Diretoria; condição contratual não concede gestão |

Valores, limites/compromissos, rituais e Destaque Cultural não podem incluir PJ em sua audiência. Outras seções precisam de pertinência expressa à parceria para esse público. A gestão continua responsável por classificar o conteúdo: a demonstração não usa análise semântica para identificar compromissos escondidos em um texto genérico.

A projeção de leitores remove rascunhos, histórico editorial e seções não autorizadas. PJ recebe manual indisponível/sem capítulos; mesmo um gestor PJ não registra ciência como empregado. A prévia editorial é uma capacidade de curadoria da conta autenticada, não uma troca de perfil.

## Versionamento e ciência compartilhada

- Publicação cria snapshot com número, autor, data e resumo. Editar/salvar rascunho preserva a publicação anterior.
- Recuperar uma edição histórica cria um rascunho; exige outra publicação para alterar a experiência do leitor.
- O manual possui versão própria. Alterações de PDF, capítulos, links ou disponibilidade criam outra versão na publicação. Alterar apenas a apresentação da página mantém a versão do manual.
- IDs imutáveis de arquivos identificam substituições; a regeneração de URLs Blob após recarregar não cria versões falsas.
- A ciência exige manual disponibilizado, ator CLT/Estágio e versão atual explicitamente identificada. Manual ausente não pode gerar ciência. Uma referência a versão obsoleta é rejeitada.
- Ledger único por conta/organização/perfil e versão de manual. A mesma ciência aparece em **Cultura e no próprio Onboarding**, com origem e horário originais. Repetir a ação no outro módulo retorna o registro existente.
- Nova versão preserva ciências anteriores e permite ciência própria da nova versão. Não há assinatura digital, presunção de compreensão, adesão automática ou conclusão automática de tarefas de Onboarding.
- Ao abrir a jornada de outra pessoa, a gestão recebe somente o link ao manual; não registra nem presume ciência em nome do profissional. A integração não altera processos ou modelos de Onboarding/Offboarding.

## Hall de Destaques

Integração de leitura por referência ao estado local existente. Mostra apenas nome, mês e mensagem de reconhecimentos culturais **já publicados**, sem respostas de avaliação, fontes internas, notas negativas, rascunhos, pontuações ou dados financeiros. Não cria, valida ou publica vencedores e não modifica o Hall. Reconhecimentos da demonstração permanecem fictícios e separados da curadoria institucional. A galeria Cultura não usa as imagens geradas anteriormente para o Hall.

## Persistência e limites

Reutiliza IndexedDB `youcon-demo-v1`, store `demos`, com namespaces próprios:

- `culture-v1:${organização}:${usuário}:${papéis ordenados}:${vínculo}`;
- `culture-reading-v1:${mesmo escopo}`.

Onboarding usa as mesmas chaves da Cultura para consultar o manual e a ciência, mantendo suas demais chaves intactas. Blobs são serializados/restaurados pela infraestrutura local existente. Não há sincronização entre contas, dispositivos ou abas abertas simultaneamente, notificações reais ou armazenamento remoto. Alterar domínio de Preview não transporta os estados locais de outra origem.

Os comandos e projeções locais demonstram os fluxos; não tornam JavaScript/IndexedDB invioláveis. Autor, horário e ciência não têm garantia autoritativa de servidor. Persistência multiusuário, autorização definitiva, auditoria inviolável, assinatura e custódia de arquivos dependerão de etapa futura autorizada. Não utilizar dados reais na demonstração.

## Homologação e recuperação

Branch de funcionalidade, deployment Preview separado. Concluir validações proporcionais e conferir SHA, branch, projeto correto, target Preview (`null`) e READY. Preservar proteção de login e não usar links/tokens de bypass. Pela autorização permanente de 26/11/2026, atualizar automaticamente `https://youcon-people-preview.vercel.app` sem nova aprovação por entrega, verificando o destino. Falhas obrigatórias conservam a versão anterior. Produção não é promovida ou modificada. Ver [fluxo vigente](../PREVIEW.md).

Em falha, manter o alias na versão anterior READY. Após uma troca autorizada, recuperação consiste em reapontar somente o alias Preview ao deployment registrado anteriormente. Não há dependência de restauração do Supabase. Recuperação editorial local ocorre por versão histórica como rascunho e nova publicação; ciências anteriores permanecem preservadas.
