# Validação — Plano de Carreira e PDI

Data: 24/11/2026. Branch: `feat/youcon-career-pdi`, baseada em `944ba84` (Home Office e módulos anteriores). Dados exclusivamente fictícios.

## Checks

| Verificação                           | Resultado                       |
| ------------------------------------- | ------------------------------- |
| ESLint, sem warnings                  | PASS                            |
| Next typegen + TypeScript sem emissão | PASS                            |
| Vitest                                | 165 testes / 16 arquivos — PASS |
| Build Next.js 16.4.1 / webpack        | PASS                            |
| `git diff --check`                    | PASS                            |

## Navegador: app completo e API sintética em loopback

| Suíte             | Resultado                         | Cobertura principal                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `career-pdi.mjs`  | PASS, 445 GETs, 0 mutações de API | Sete contextos de acesso; mapa por teclado/zoom; cargo publicado e recarga; conteúdo financeiro ausente da serialização do profissional/líder; tipos CLT/estágio/PJ; análise RH; aprovação/reserva da Diretoria; efetivação local e consentimento editorial RH; diretrizes versionadas; aprovação PDI pelo RH; criação/revisão da equipe; evidência com arquivo após recarga; conclusão de ação/feedback próprio; exclusão de PJ participante; desktop e mobile |
| `people.mjs`      | PASS, 0 mutações de API           | Pessoas, navegação de todas as páginas, dashboard, organizações e escopos; regressão de documentos com filtros/cards/blocos/anexos/publicação/histórico/duplicação/arquivamento/leitura e públicos                                                                                                                                                                                                                                                              |
| `home-office.mjs` | PASS, 263 GETs, 0 mutações de API | Escalas, prazos, revisões, complementações, persistência, regras versionadas e escopos                                                                                                                                                                                                                                                                                                                                                                          |
| `onboarding.mjs`  | PASS, 167 GETs, 0 mutações de API | Kanban, filtros, colunas, modelos/aprovação, arquivos, persistência, formulários e mobile                                                                                                                                                                                                                                                                                                                                                                       |
| `offboarding.mjs` | PASS, 229 GETs, 0 mutações de API | Escopos, kanban, colunas, tipos de desligamento, arquivos e persistência, modelos, independência do Onboarding e mobile                                                                                                                                                                                                                                                                                                                                         |

Testes iniciam Next e Auth/Data API sintéticos em `127.0.0.1:3103/3104`. O servidor sintético rejeita qualquer método diferente de GET. Testes não usam credenciais administrativas, usuários reais, Auth remoto ou fixtures no Supabase. Sessões sintéticas existem somente no harness de teste; a aplicação mantém autenticação real e não possui seletor de papel/bypass.

## Inspeção visual

Capturas locais em `work/career-review/`, não versionadas: `admin-overview.png`, `admin-map.png`, `salary-bands.png`, `cycles.png`, `simulation.png`, `employee-career.png`, `pdi-admin.png`, `pdi-individual.png`, `pdi-mobile.png`, `career-mobile.png` e contextos de equipe. Inspeção de mapa em Y, cards, painel financeiro, heros e versão mobile. Asserção de largura da página sem transbordamento horizontal em 390 px; o mapa tem rolagem interna e zoom. Navegação de card por teclado e modais com Escape. Nenhum erro JavaScript de página na suíte nova.

## Limites do resultado

Os testes confirmam a demonstração local e seus controles de interface/domínio. Não comprovam autorização de persistência remota, auditoria inviolável, contabilidade de folha, sincronização de sessões ou compatibilidade com estruturas futuras de banco. Não há integração de servidor para os dados de carreira/PDI.

O fluxo RH → Diretoria e líder → RH está demonstrado por estados preparados para cada perfil, pois cada conta/organização/perfil tem armazenamento local independente. Isso está sinalizado nas telas. Não inserir dados pessoais ou financeiros reais.

Supabase, Auth, RLS, grants, produção e a outra aplicação permanecem sem alterações. Nenhuma migration, seed ou merge executado. Para Preview, manter o alias anterior até deployment READY do mesmo commit e confirmar projeto, branch, proteção e destino antes da troca. O retorno para o deployment anterior pode ser feito reatribuindo somente o alias, sem rollback global ou alteração de dados.
