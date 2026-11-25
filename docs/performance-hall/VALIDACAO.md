# Validação — Avaliação de Desempenho e Hall de Destaques

25/11/2026 (Brasília). Branch `feat/youcon-performance-hall`, base `a30627a` (Carreira/PDI e módulos anteriores). Desenvolvimento retomado dos arquivos existentes, sem reinício ou descarte de alterações.

## Checks técnicos

| Verificação                           | Resultado                           |
| ------------------------------------- | ----------------------------------- |
| ESLint sem warnings                   | PASS                                |
| Next typegen e TypeScript sem emissão | PASS                                |
| Vitest                                | **197 testes / 18 arquivos — PASS** |
| Build Next.js 16.4.1 / webpack        | PASS                                |
| `git diff --check`                    | PASS                                |

As suítes novas de domínio cobrem organização, equipe/setor, papéis, PJ, projeções privadas/públicas, compatibilidade por função/vínculo, critérios versionados, pesos e Não observado, ciclo, rascunho, validação sem autoaprovação e liberação separada. Cobrem também recorrências semanais/quinzenais/personalizadas, mensal em ano bissexto, idempotência, cancelamento futuro sem recriação, diário e consolidação confidenciais.

Hall: elegibilidade, ausência de categoria operacional geral, restrição cultural PJ, consentimento de publicação, duplicidade mensal, impedimento de publicação futura, imutabilidade de reconhecimento validado/publicado, snapshots de regras/configuração, isolamento de ranking por categoria/semestre, empates, prioridade manual, reinício semestral sem apagar histórico e consistência do retrato fictício por pessoa. Referências para PDI/Carreira não alteram a avaliação nem criam efeitos de carreira/financeiros.

## Navegador — app completo, Auth/Data API sintéticos em loopback

| Suíte                  | Resultado                    | Evidências principais                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `performance-hall.mjs` | PASS, 0 mutações de API      | Oito perfis/contextos distintos; avaliação → RH → liberação → candidato → preparação → validação → publicação; modelo duplicado e preservado após recarga; conexão real local a PDI e ciclo de Carreira; modelos Revenue separados; recorrência e mesma base em Metas; evidência persistente e consolidação com diário; foto Blob após recarga; ranking por categoria; cerimônia sem publicar; movimento reduzido, Escape, teclado e mobile |
| `people.mjs`           | PASS, 1.507 GETs, 0 mutações | Pessoas, organizações, navegação de todos os módulos e dashboard; documentos com editor, filtros, anexos, publicação, histórico, duplicação, arquivamento, leitura e públicos                                                                                                                                                                                                                                                               |
| `career-pdi.mjs`       | PASS, 498 GETs, 0 mutações   | Regressão completa de Carreira/PDI: mapa, finanças privadas, simulações, reservas, publicação RH, criação/aprovação de PDI, evidências, progresso e recarga; PJ supervisor não recebe link de Avaliação                                                                                                                                                                                                                                     |
| `home-office.mjs`      | PASS, 285 GETs, 0 mutações   | Escalas, prazos, revisões, complementações, regras, persistência e escopos                                                                                                                                                                                                                                                                                                                                                                  |
| `onboarding.mjs`       | PASS, 181 GETs, 0 mutações   | Kanban, modelos/aprovação, arquivos, formulários, persistência e mobile                                                                                                                                                                                                                                                                                                                                                                     |
| `offboarding.mjs`      | PASS, 245 GETs, 0 mutações   | Escopos, kanban, colunas, tipos de desligamento, arquivos, modelos, persistência e independência do Onboarding                                                                                                                                                                                                                                                                                                                              |

Contextos novos: RH, Diretoria, liderança CLT, profissional CLT, estagiário, profissional PJ, liderança PJ e titular PJ com papel administrativo RH já existente. A última situação conserva sua função administrativa e não transforma PJ em participante de avaliação cultural/empregado.

O harness usa Next em `127.0.0.1:3103` e API sintética em `127.0.0.1:3104`. A API rejeita qualquer método diferente de GET; o navegador registra e reprova contatos a Supabase hospedado. Build de testes usa somente URL e chave pública sintéticas de loopback. Não há contas reais, fixtures remotas, bypass de login no produto ou alterações em Auth/RLS/grants.

Execução: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3104 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_loopback npm run build`; depois `RUN_BUILT_APP=1 node tests/browser/performance-hall.mjs`. Playwright e Chromium são os já disponíveis na infraestrutura local, sem novas dependências no produto.

## Inspeção visual e acessibilidade

Capturas em `work/performance-hall-review/` (não versionadas): visão geral analítica, dashboards Revenue por função, consolidação da liderança, destaques mensais, pódio, revelação da cerimônia, conquistas individuais e telas mobile. Retratos fictícios gerados por IA estão versionados em `public/demo/hall/`; cada pessoa mantém o retrato entre campanhas.

Inspeção desktop 1440 px e mobile 390 px, com asserção de ausência de transbordamento horizontal da página. Tabs e diagramas têm rolagem interna quando necessária. Controles de formulário têm rótulos explícitos, modais fecham com Escape, e há testes de teclado. Cerimônia mantém foco no diálogo; preferência de movimento reduzido remove suspense animado/confetes. Não equivale a uma auditoria WCAG completa.

## Limites e preparação de homologação

As verificações confirmam a demonstração local. Não comprovam persistência multiusuário, autorização de banco, contabilidade, auditoria inviolável, integração operacional ou dados reais. Histórico/autoria/horário são demonstrativos. Armazenamento é isolado por navegador, usuário, organização e papéis; contas não se sincronizam. Não inserir dados reais.

Supabase, produção, portal operacional e permissões remotas não foram alterados. Nenhuma migration, seed remota, merge, pagamento ou promoção executada.

A branch de feature pode gerar deployment Preview automaticamente pelo Git. A atualização do **link fixo** é uma etapa separada: verificar projeto, SHA, branch, target Preview, estado READY e proteção existente; apresentar a versão concreta e obter aprovação manual antes de atribuir `youcon-people-preview.vercel.app`. Não usar URLs de bypass nem promover a produção. Durante esta preparação o alias fixo mantém o deployment anterior.

Recuperação: antes de qualquer troca autorizada, registrar o deployment anterior do alias. Se necessário, reapontar somente o alias para esse deployment READY. Não há dependência de rollback/restauração do Supabase ou produção; os estados locais novos têm namespaces próprios. Restaurar demonstração é ação local confirmada pelo usuário e não limpa os outros módulos.
