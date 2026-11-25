# Validação de Recrutamento e Seleção

## Ambiente e checks

Next.js otimizado com URL e chave pública exclusivamente fictícias em loopback (`127.0.0.1:3104`), Chromium headless em `127.0.0.1:3103`. API sintética recusa métodos diferentes de GET. Harness reprova qualquer contato com host Supabase remoto. Cookies sintéticos existem apenas no harness externo, sem bypass no produto.

- Next typegen / TypeScript: PASS.
- ESLint sem warnings: PASS; arquivos de navegação por links revisados novamente após o ajuste final.
- Vitest: **286 testes / 22 arquivos — PASS**.
- Build Next.js otimizado: PASS.
- `git diff --check`: PASS.

## Testes novos — 43 casos

`tests/recruitment.test.ts` (38) e `tests/recruitment-navigation.test.ts` (5):

- Guardas de servidor e categoria independente, escopo autenticado e negação de acesso direto a profissional/PJ/Diretoria nas áreas privadas;
- Isolamento por organização e projeções separadas RH/Diretoria/liderança;
- Diretor sem identidade pessoal, CV, DISC, notas, respostas ou análise Match; liderança somente com candidaturas designadas e conteúdo técnico compartilhado;
- Atribuição/revogação pelo RH, escrita técnica designada e proibição de nota privada por liderança; anexos de respostas só são compartilhados com permissão adicional explícita para CV/arquivos;
- Vagas, cópias como rascunho, pausa/publicação/encerramento, impedimento de edição de vaga encerrada e de remoção de etapa ocupada;
- Snapshots de formulário/etapa, campos e checklists obrigatórios, condições de visibilidade, motivo de movimentação e passagens explícitas; conversão que não é inflada por saltos de etapa;
- Pessoa canônica em várias vagas e candidatura repetida idempotente;
- Agenda e automações exclusivamente locais, filtros combinados e consultas salvas;
- Formulários condicionais sem ciclos, prévia de carreiras, consentimento demonstrativo, token exclusivo e deduplicação de e-mail;
- Proibição de armazenamento remoto de currículo;
- Match: evidência positiva, não atendimento explícito, ausente e conflito; cobertura separada, análise em lote e ausência de decisão/movimentação automática;
- Recusa de critérios pessoais protegidos/irrelevantes;
- Instrumentos individuais, snapshots e respostas RH sem diagnóstico;
- Ativação/condição de automações, rascunho incompleto de proposta, aprovação RH antes de proposta e bloqueio de envio sem valor revisado;
- Exceção financeira do valor exato pela Diretoria e proibição de autoaprovação;
- Formalização RH com confirmação, aceite, orçamento e posição disponível, repetição idempotente;
- Pacote de dados autorizados e cópia canônica única para Onboarding, com usuário não associado;
- Finalidade/retenção versionadas e anonimização local de dados, arquivos, notas, respostas, instrumentos e análises.

## Navegador — jornada completa

`RUN_BUILT_APP=1 node tests/browser/recruitment.mjs`: **PASS**, 569 consultas sintéticas, zero escritas e zero erros JavaScript nas jornadas executadas.

A jornada exercita dashboard, navegação, Kanban drag/drop e seletor, customização de etapas e lista, banco com filtros salvos, importação PDF e recarga, Match individual/lote/comparação sem mutação das candidaturas, notas RH privadas, instrumento individual, aprovação humana, proposta, bloqueio de formalização sem confirmação, contratação fictícia e criação idempotente do Onboarding, construtor com condição, página de carreiras protegida, formulário geral/deduplicação e anonimização, organização independente, exceção pela Diretoria, liderança técnica designada, negação a profissionais/PJs/estagiários, mobile, teclado/Escape e movimento reduzido.

O cenário do link individual foi repetido após o ajuste da navegação, incluindo abertura de instrumento criado no armazenamento local após a hidratação. As revisões finais da conversão do funil e da permissão de anexos em respostas receberam testes específicos para saltos de etapa e compartilhamento explícito de CV/arquivos, além de TypeScript, lint, suíte completa e novo build; não alteraram componentes compartilhados ou ações da jornada. Resultados registrados em `work/recruitment-review/`.

## Regressões em navegador — PASS

| Suíte                           | Consultas sintéticas | Escritas na API |
| ------------------------------- | -------------------: | --------------: |
| Pessoas, documentos e navegação |                1.445 |               0 |
| Onboarding                      |                  197 |               0 |
| Offboarding                     |                  257 |               0 |
| Cultura                         |                  472 |               0 |
| Academy                         |                  486 |               0 |
| Avaliação e Hall                |                  831 |               0 |
| Carreira e PDI                  |                  556 |               0 |
| Home Office                     |                  314 |               0 |

O ajuste final do link individual restringiu-se à rota e componentes de Recrutamento; os arquivos compartilhados já estavam nesta versão durante as regressões. Não foram modificados após esses resultados.

## Inspeção visual e limites

Capturas locais: `work/recruitment-review/` (dashboard, Kanban, banco, Match, proposta, automações, carreiras, liderança e celular). Conferidos desktop 1440 px e mobile 390 px, sem overflow horizontal da página; Kanban e comparações têm rolagem interna. Controles rotulados, botões de movimentação para teclado, modais com Escape e preferência de movimento reduzido. Não equivale a auditoria WCAG completa.

Somente dados/arquivos fictícios. Não há OCR, IA real, diagnóstico psicológico, mensageria, recebimento público, assinatura, pagamento, contratação real ou cadastro Auth. Não foram executadas migrations, seeds remotas, alterações no Supabase, merge ou produção. As referências à Base Central/admissão permanecem preparadas; somente o Onboarding possui cópia local explícita dos dados mínimos autorizados. Privacidade e logs locais não são invioláveis nem uma garantia definitiva LGPD.

Preview: confirmar projeto, SHA, branch, READY, target Preview e proteção por login. Atualização do alias fixo exige autorização manual da versão concreta; manter o deployment anterior disponível e produção intacta. Não utilizar bypass de autenticação para teste remoto.
