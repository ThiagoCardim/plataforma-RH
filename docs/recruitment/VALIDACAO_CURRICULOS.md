# Validação — Banco de Currículos

Data: 26/11/2026. Continuidade sobre `17b6f0d`, branch `feat/recruitment-resume-database`.

## Checks e ambiente

- **368 testes Vitest / 24 arquivos: PASS.** Inclui 45 casos novos em `recruitment-resumes.test.ts` e os 323 existentes.
- TypeScript / Next typegen: PASS.
- ESLint, zero warnings: PASS.
- Build Next.js otimizado (Webpack): PASS.
- `git diff --check`: PASS.
- Cinco suítes de navegador, sequenciais no build otimizado: PASS.

Chromium e Auth/Data API exclusivamente sintéticos em loopback (`127.0.0.1:3103` / `3104`). O servidor de teste rejeita métodos diferentes de GET, e o harness detecta contato com Supabase remoto. Cookies de teste existem somente no harness, sem bypass no produto. Todos os dados, telefones, e-mails, documentos e organizações das capturas são fictícios. Nenhuma escrita na API sintética ou no Supabase compartilhado.

## Cobertura de domínio adicionada

- Upgrade idempotente da base v2, preservando registros e referências históricas, removendo a antiga coluna Banco e mantendo sua seleção como estrela/arquivamento;
- Base com candidatos sem processo, em seleção, encerrados, antigos profissionais e arquivados, sem perder a pessoa canônica;
- Estrela independente de movimentações, histórico ou estado de contratação;
- Atualidade por meses de calendário, limites inclusivos 3/6/12, último dia do mês e configurações inválidas;
- Contatos e lembretes sem renovar artificialmente o currículo;
- Primeiro cadastro conservado, versões de campos e arquivos e prevenção de revisão duplicada ao combinar domínio/store;
- Match incluindo currículos sem processo e exclusão de dados expirados, aliases, anonimizados e falta de interesse;
- Convites aleatórios, vinculados à organização/pessoa/revisão, uso único, prazo, revogação e invalidação por edição concorrente;
- DTO do candidato sem avaliações, anotações, elegibilidade, valores, classificações RH ou histórico interno; payload não substitui identidade, organização e campos internos;
- Atualização no mesmo cadastro, inclusive confirmação sem mudanças, preservando processos/negociações e registrando a resposta recebida;
- Negação de comandos a Diretoria, liderança e demais profissionais, sem ampliar papéis; eliminação das novas estruturas privadas das projeções;
- Nome/e-mail/telefone com normalização brasileira e nenhum merge automático; recebimento pendente sem sobrescrita;
- Comparação com escolha de campos, unificação ou separação explícitas, data mais antiga, referências de processos/propostas/avaliações/vínculos e versões preservadas;
- Convites revogados ao unificar, repetição de decisão fechada bloqueada e dois vínculos ativos impedindo unificação;
- Preservação de respostas personalizadas/arquivos do formulário recebido na revisão, inclusive após unificação;
- Arquivamento somente de encerrados/formalizados, regra habilitável/idempotente e proteção contra usar a idade da etapa para antecipar um encerramento recente;
- Arquivados de ciclos anteriores consultáveis e reativação sem substituir outra seleção ativa; vínculo/admissão não são encerrados pelo arquivo;
- CSV com BOM, aspas, escapes e linhas internas; mapeamento obrigatório, duplicidades dentro da planilha e na base, seleção de linhas, revisão, idempotência do lote e relatório;
- Linha inválida impedindo alterações parciais e novos registros importados sem abrir processos automaticamente;
- Retenção/anonimização abrangendo novas estruturas e motivos privados de arquivo removidos das projeções gerenciais/técnicas.

## Jornadas reais de interface — dados fictícios

### `tests/browser/recruitment-resumes.mjs` — PASS

- Tabela de todos os currículos, inclusive os sem processo, e migração sem coluna Banco;
- Marcar talento, consultar o recorte e restaurar após reload;
- Solicitar atualização, visualizar convite, abrir prévia sem navegação administrativa e sem criar conta do candidato;
- Alterar cadastro, anexar novo PDF, confirmar o mesmo cadastro, conservar data inicial e impedir reenvio de convite utilizado;
- Consultar versões e arquivos após reload; registrar contato, situação e retorno;
- Comparar duplicidade, escolher cidade, justificar, confirmar unificação e verificar preservação dos IDs de processos;
- Receber formulário coincidente sem cadastro automático, decidir manter pessoas separadas e preservar os históricos;
- Carregar planilha fictícia, mapear, pré-visualizar duplicidades e confirmar simulação; relatório de um novo cadastro e uma revisão pendente, sem processo automático;
- Match consultando pessoa sem seleção ativa, com estrela, evidências e disponibilidade;
- Alterar intervalos/validade/regra de arquivo e conferir persistência;
- Filtros combinados, tabela/cards em 390px sem overflow da página, movimento reduzido e ficha por Enter/Escape;
- Cadastro manual com retenção padrão conforme a configuração vigente;
- Rotas do Banco e formulário negadas à Diretoria, liderança e profissionais sem RH.

### `tests/browser/recruitment.mjs` — PASS

Regressão adaptada à nova classificação: 12 etapas, drag/drop, entrada sem vaga, seleção de talento independente, arquivamento/novo ciclo pelo Banco, Match, proposta recusada, admissão única por ciclo, formalização CLT/Estágio/PJ com documentos e Flash, pacote autorizado de Onboarding, Offboarding confirmado, indicadores, configuração de cards, papéis e mobile. Zero mutações na API sintética.

### Demais regressões executadas — PASS

- `people.mjs`: Pessoas/cadastro/edição, navegação dos demais módulos, documentos/editor/blocos/arquivos/publicação/histórico/ciência e escopos de acesso. Zero mutações.
- `onboarding.mjs`: trilhas, cards/arrastar, filtros, modelos, prazos, editor, arquivos/reload, permissões e mobile. Zero mutações.
- `offboarding.mjs`: escopos, trilhas RH/operacional, tipos de desligamento, editor/arquivos/reload, modelos e independência do Onboarding. Zero mutações.

Os testes de domínio existentes dos demais módulos também passaram na suíte completa. Não foram repetidas suítes de interface sem relação com a alteração após os checks pertinentes passarem.

## Evidência visual e limites

Capturas em `work/recruitment-review/`: `resume-database.png`, `resume-update-invitation.png`, `resume-individual-history.png`, `resume-duplicate-comparison.png`, `resume-import-review.png`, `resume-match-whole-database.png`, `resume-mobile-table.png`, `resume-mobile-cards.png`, além das capturas da regressão do recrutamento. `work/` não é versionado e não contém dados reais.

A prévia de atualização continua protegida pela autenticação RH existente, sem login adicional de candidato e sem habilitar acesso público real. Tokens e prazos são demonstrativos locais; precisam de servidor para garantia autoritativa. Não há sincronização entre contas/dispositivos/abas, envio WhatsApp, leitura Pipefy, OCR ou IA externa. CSV/TSV são os formatos suportados pela demonstração de planilha; XLSX deve ser exportado como CSV.

Homologação segue a autorização permanente em [AGENTS.md](../../AGENTS.md) e [PREVIEW.md](../PREVIEW.md): concluir checks, conferir SHA/branch/projeto/Preview/READY e proteção, atualizar somente o alias fixo, conferir destino/proteção/produção e informar o link sem nova confirmação. Em falha obrigatória, conservar a versão anterior. Sem Supabase, produção, permissões ou merges.
