# Validação — Recrutamento centralizado

Relatório da rodada estrutural anterior. A validação vigente do Banco de Currículos está em [VALIDACAO_CURRICULOS.md](VALIDACAO_CURRICULOS.md): 368 testes e cinco suítes de interface, com o novo cadastro centralizado.

Data: 26/11/2026. Continuidade de `4701d9b`, branch `feat/recruitment-central-workflow`.

## Ambiente

Next.js otimizado, Chromium headless e Auth/Data API inteiramente sintéticos em loopback (`127.0.0.1:3103`/`3104`). A API de teste rejeita métodos diferentes de GET; o harness também reprova contato com hosts Supabase remotos. Os cookies sintéticos existem apenas nos testes externos à aplicação. Nenhum bypass foi incorporado ao produto. Todos os nomes, documentos e organizações dos testes são fictícios.

## Checks

| Verificação | Resultado |
| --- | --- |
| TypeScript / geração de tipos Next | PASS |
| ESLint, zero warnings | PASS |
| Vitest, 323 testes em 23 arquivos | PASS |
| Build Next otimizado | PASS |
| `git diff --check` | PASS |
| Recrutamento: navegador, teclado, mobile e movimento reduzido | PASS |
| Regressões dos oito módulos existentes | PASS |
| Escritas na API sintética / Supabase compartilhado | 0 |

As rotas dos módulos existentes, autenticação, isolamento por organização e projeções de RH/Diretoria/liderança/profissional foram exercitados. O build de teste usa apenas URL e chave pública fictícias de loopback. A verificação funcional não utiliza o banco hospedado ou cadastros reais.

## Testes de domínio

`recruitment-workflow.test.ts`: **37 casos**, incluindo CLT/Estágio/PJ parametrizados. Somados aos 38 casos legados e cinco de navegação/guardas, são 80 testes específicos de recrutamento. Os demais 243 são regressões existentes do projeto.

Cobertura nova:

- Upgrade idempotente do armazenamento antigo, preservando candidatos, notas, respostas, instrumentos, arquivos e snapshots completos das etapas e visitas originais;
- Formulário geral sem vaga, entrada correta mesmo após reorganizar colunas, consentimento/obrigatoriedades, pessoa canônica e deduplicação de e-mail;
- Saltos e retornos livres, motivo e histórico; movimento em lote inválido sem alteração parcial;
- Banco selecionado pelo RH, sem inclusão de reprovados/desqualificados; reativação e proveniência;
- Experiência RH independente da autodeclaração e filtros combinados;
- Proteção de etapas ocupadas/funções essenciais e automações locais limitadas à etapa;
- Aprovação para contratar sem vínculo ativo; uma admissão por ciclo mesmo indo/voltando; separação dos três vínculos;
- CLT com referência/confirmação Flash; Estágio/PJ com assinatura, informações e documentos próprios; snapshots que não podem ser substituídos pela edição de acompanhamento;
- Finalização explícita e idempotente; bloqueio do caminho legado, vínculo ativo repetido, ausência de confirmação, aprovação retirada ou campos/atividades pendentes;
- Recusa com motivo e preservação da proposta; reativação de recusa e de admissão cancelada em novos ciclos; formalização não contorna proposta existente sem aceite ou com valor divergente;
- Posições preenchidas somente por formalizações confirmadas e contagem parcial;
- Pacote autorizado e Onboarding canônico, sem criar conta, papel ou duplicidade;
- Offboarding iniciado no módulo existente; arquivamento não encerra vínculo; atividades obrigatórias e confirmação RH; desligamento preserva admissão e permite outro ciclo histórico;
- Elegibilidade revisada pelo RH, escopo por organização e negação de decisões para Diretoria/liderança;
- Eliminação das novas estruturas privadas das projeções gerenciais/técnicas e da anonimização;
- Match avulso com evidências, sem movimentação; indicadores por passagens, formalizações e coortes maduras; motivos históricos mantidos mesmo após excluir uma etapa vazia.

## Jornadas no navegador

`tests/browser/recruitment.mjs` passou com zero mutações na API sintética e sem erros JavaScript:

1. **Entrada:** formulário independente autenticado, sem chrome administrativo nem escolha de vaga; cadastro aparece em Entrada e sobrevive ao reload.
2. **Triagem:** arrastar/soltar, confirmação com motivo, saltos e retornos por seletor. Ficha lateral, nível validado RH separado, vínculo opcional de vaga, filtros e alternância de tabela/quadros.
3. **Banco:** inclusão por etapa, seleção/reativação e proveniência do Banco conservada no processo posterior.
4. **Proposta recusada:** aprovação humana, preparação/envio fictício, motivo obrigatório e coluna de recusa, preservando negociação.
5. **Admissão única:** Contratados cria a admissão sem vínculo; voltar e avançar não cria duplicidade.
6. **Três vínculos:** confirmação Flash para CLT; arquivo, assinatura e formulário individual para PJ e Estágio; formalização explícita RH.
7. **Onboarding:** pacote somente com nome autorizado; confirmação de início no módulo existente, sem duplicar a pessoa ou criar conta.
8. **Offboarding:** referência ao vínculo local, bloqueio por pendências, conclusão das duas trilhas e confirmação explícita de encerramento. Histórico e admissão conservados.
9. **Indicadores/configuração:** contagem das três formalizações, origem Banco, funil e filtros; personalização dos cards persistida após reload. Há indicadores de ausência de dados quando apropriado.

Adicionalmente: Match em lote com evidências e perguntas; Diretoria somente gerencial; liderança somente designados; rotas privadas/formulários negados aos demais perfis; anonimato redirecionado ao login; viewport de 390px sem overflow da página; painel por Enter/Escape e respeito a movimento reduzido.

Screenshots locais em `work/recruitment-review/`: `central-kanban.png`, `candidate-side-panel.png`, `match-evidence.png`, `admission-clt-confirmed.png`, `offboarding-linked-gate.png`, `indicators.png`, `configuration.png`, `mobile-central.png`, `director-managerial.png`, `leadership-assigned.png`. Contêm exclusivamente dados sintéticos. A pasta `work/` permanece fora do Git.

## Regressões de interface

Todos os scripts abaixo passaram sequencialmente no mesmo build otimizado, cada um com contexto fictício isolado e **zero mutações**:

- `people.mjs`: Pessoas, cadastros/edição, navegação, documentos/blocos/arquivos/publicação/histórico/ciência e guardas de público/papel. A contagem do menu da Diretoria foi ajustada à nova subaba gerencial Indicadores; liderança deixa de ter Gestão de Vagas e mantém somente os designados no processo.
- `onboarding.mjs`: trilhas, cards/arraste, filtros, modelos, duração, editor, arquivos e reload.
- `offboarding.mjs`: separação das trilhas/escopos, modelos por desligamento, arquivos, independência do Onboarding e mobile.
- `culture.mjs`: página institucional, editor/publicação, manual/ciência única com Onboarding, versões e escopo PJ.
- `academy.mjs`: cursos/player/evidências/trilhas/licenças/editor/publicação/reload e escopos.
- `performance-hall.mjs`: avaliação, snapshots, privacidade, PDI/carreira, lideranças, reconhecimentos e cerimônia.
- `career-pdi.mjs`: mapa, simulações, publicação, reserva financeira, PDI, evidências e restrições PJ.
- `home-office.mjs`: escalas, relatórios/prazos/complementações, revisões, regras, trocas e escopos.

## Limites e homologação

Os testes demonstram o comportamento local. IndexedDB/JavaScript não oferecem segurança, assinatura, relógio, sincronização ou auditoria autoritativos. Não há OCR, IA externa, coleta pública, mensagens reais, integração Flash/portal operacional ou criação/revogação real de vínculo/acesso.

A autorização permanente de 26/11/2026 permite atualizar automaticamente o alias fixo após concluir a tarefa, sem nova aprovação por entrega. Conferir validações proporcionais, SHA/branch/projeto/ambiente Preview/READY/proteção antes da troca e verificar o destino depois. Falhas obrigatórias conservam a versão anterior. Produção e Supabase permanecem inalterados. Não utilizar URLs de bypass. Ver [fluxo vigente](../PREVIEW.md).
