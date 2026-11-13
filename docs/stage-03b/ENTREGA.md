# Etapa 03B — Base Central de Pessoas demonstrativa

Entrega para revisão, 13/11/2026. Branch `feat/youcon-people-stage-03b`, derivada da documentação 03A (`657a467`), que inclui a Etapa 02.1 (`7a260ed`). PRs #1 e #2 preservados, sem merge. [D01–D15 consolidadas](DECISOES.md) prevalecem sobre propostas anteriores conflitantes.

## Telas e uso

Entrar com conta existente de RH/Diretoria → Gente & Gestão → Pessoas.

| Rota | Interface demonstrável |
| --- | --- |
| /gente-gestao | Guarda de servidor e redirecionamento para a Base |
| /gente-gestao/pessoas | 14 pessoas fictícias, resumo explicitamente demo, pesquisa sem distinção de acento/caixa, filtros combinados de setor/tipo/situação, tabela responsiva com rolagem interna, paginação de 8 itens, vazio, loading |
| /gente-gestao/pessoas/nova | Cadastro mínimo em quatro seções, campos por CLT/estágio/PJ, validação e resumo de erros com foco, revisão manual de possível duplicidade, simulação em memória sem conta de acesso |
| /gente-gestao/pessoas/[id] | Ficha com vínculo vigente, cadastro, linha do tempo, contratos anteriores e situação de acesso; ficha ausente após descarte/reload é explicada |
| /gente-gestao/pessoas/[id]/editar | Edição temporária, identificação/contato/profissional/vínculo separados. Tipo e início originais preservados; eventos ilustrativos acrescentados sem remover anteriores |

A ficha de Marina Exemplo contém contrato anterior encerrado, reingresso e movimentações de setor/cargo/liderança. André Cenário e Bruno Protótipo exemplificam vínculos encerrados e acesso People bloqueado. PJ usa função/serviço contratado e responsável contratual, sem campos de salário ou benefícios CLT. Estágio apresenta instituição/curso opcionais no cadastro inicial. Código interno é gerado. Documentos, endereço, nascimento e dados financeiros não são coletados.

RH e Diretoria podem consultar/cadastrar/editar os exemplos. A aprovação excepcional pela Diretoria de pedidos feitos por profissionais do RH está consolidada e explicada na seção Acesso; não há fluxo real de aprovação nesta entrega. Encerramento/revogação People e exportação gerencial são somente regras representadas/documentadas, sem operação real.

## Componentes e arquitetura

- `src/modules/people/model.ts`: contrato de pessoa/vínculo/histórico, datas, filtros, validação e simulação pura; sem SDK, fetch ou armazenamento.
- `demo-data.ts`: fábrica de identidades inventadas por organização, com domínio `exemplo.invalid`, sem dados de colaboradores.
- `DemoProvider`: estado React em memória por instância, chave usuário/organização no layout protegido; sem estado mutável global, localStorage, sessionStorage, IndexedDB ou cookies de cadastro. Feedback só aparece após uma operação local efetiva, não por um parâmetro de URL.
- `PeopleList`, `PersonForm`, `PersonDetail`: interfaces reutilizáveis independentes de persistência. `PersonAvatar`, `StatusBadge`, `DetailGrid`, `BackToPeople`, `MissingPerson`, seções/campos de formulário compõem as telas.
- Novas páginas e layout chamam `requirePermission("people.management.view")` no servidor. Layout autenticado e proxy existentes continuam ativos. A capacidade de edição local exige também papel RH ou Diretoria recebido do contexto validado.
- Navegação e breadcrumbs reconhecem as novas rotas. Tokens e shell 02.1 preservados; CSS adicional restrito a classes da Base.

O futuro adaptador de persistência deverá substituir a fábrica e operações locais, preservando separação entre UI, regras e dados. O filtro local e o canEdit do cliente não serão a autorização de um backend: a futura integração precisará de validação, transações, grants e RLS próprios previamente aprovados.

## Verificações

| Verificação | Resultado e alcance |
| --- | --- |
| Lint | Sem avisos/erros |
| Typecheck | Tipos de rotas Next gerados; TypeScript sem erros |
| Testes automatizados | 65 testes em 9 arquivos aprovados; inclui 17 novos testes de contrato/rotas, além da suíte preservada |
| Build | Next.js 16.4.1 Webpack aprovado; novas rotas dinâmicas protegidas |
| Chromium — aplicação compilada | Fluxo completo com Auth/Data API sintéticos exclusivamente em loopback; nenhuma alteração de código para contornar guardas |
| Papéis | Anônimo redireciona ao login; profissional e liderança bloqueados nas quatro rotas diretas; RH e Diretoria navegam/cadastram/editam |
| Interações | Busca, filtros combinados, paginação, vazio, validação obrigatória e e-mail, bloqueio até revisão manual de possível duplicidade, campos condicionais PJ/estágio, histórico e edição, recarregamento descarta cadastro; contexto de segunda organização verificado |
| Responsividade | Listagem em 360/390/768/1024/1440 px; formulário a 390 px e ficha/histórico a 360 px. Sem overflow da página; tabela possui rolagem própria. Conteúdo desktop fora da área da sidebar verificado após estabilizar transição |
| Console | Sem erros JavaScript nos fluxos finais de RH/Diretoria |
| Persistência | Cadastros não aparecem em localStorage/sessionStorage; reload mostra ficha indisponível para pessoa recém-simulada |
| Proteção do banco | Teste de navegador registra apenas GET no serviço sintético, rejeita outros métodos. Módulo people não importa clientes Supabase nem chama APIs remotas |
| Preservação | Nenhum diff em supabase/, src/lib/supabase, proxy, ações Auth, política/servidor de acesso, package.json ou lockfile |

Testes existentes de SQL usam somente PGlite efêmero local. O teste de navegador não valida tokens, contas ou RLS no Supabase hospedado: substitui o serviço externo por respostas sintéticas em 127.0.0.1, mantendo o aplicativo, o proxy e os guards reais. Nenhum servidor de fixture ou modo de bypass foi adicionado à aplicação publicável.

### Reproduzir a verificação de navegador

Ferramental opcional isolado, sem alterar dependências da aplicação:

```sh
npm ci
npm install --prefix work/browser --no-save playwright@1.56.1
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3104 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_loopback npm run build
RUN_BUILT_APP=1 node tests/browser/people.mjs
```

O script inicia Next na porta 3103 e API sintética na 3104, ambas em loopback, e encerra os processos ao concluir. Requer Chromium local (`CHROMIUM_PATH`, padrão `/usr/bin/chromium`). Cookies/tokens utilizados são inventados e aceitos apenas pelo serviço de teste; não são credenciais de acesso a qualquer projeto. As variáveis sintéticas acima são para o processo de teste local, nunca para Vercel ou arquivo versionado de ambiente. Capturas e log locais ficam em `work/stage-03b`.

## Revisão visual

Capturas da aplicação compilada com conta e pessoas sintéticas, sem Supabase hospedado:

- [Listagem desktop](review/list-desktop.png)
- [Listagem celular](review/list-mobile.png)
- [Formulário celular](review/form-mobile.png)
- [Ficha e histórico desktop](review/history-desktop.png)
- [Histórico celular](review/detail-mobile.png)

A validação final aguarda hidratação antes da primeira interação e estabilização das transições antes de capturar. Uma captura inicial durante transição de viewport foi descartada; a geometria final desktop foi conferida no navegador.

## Limitações e segurança

Todos os cadastros e alterações são descartáveis. Recarregar, sair da Base ou trocar contexto pode reiniciar a demonstração. A data de referência dos exemplos é 13/11/2026 e aparece na listagem. Simulação não cria conta, não atribui papel e não atualiza o perfil real exibido no menu autenticado.

Não foram implementados persistência, auditoria real, anexos, convite de contas, revogação de acesso, encerramento/reingresso interativo, solicitações, decisões de aprovação ou exportação. Histórico local ilustra o modelo; não oferece garantias de auditoria contra manipulação do navegador. Não há integração real de dados cadastrais. O módulo de Dashboard permanece sem indicadores reais.

O banco atual continua sem permissões de escrita authenticated para cadastro, sem tabelas cadastrais de pessoas e sem capacidades de aprovação/exportação. Essa lacuna foi mantida e documentada: não foi ampliada por botões ou por novas concessões. O acesso real em Preview ainda usa a autenticação existente; sessões reais autenticadas, renovação e logout não foram novamente homologados nesta rodada. A conta de RH/Diretoria já autorizada é necessária para a revisão online.

**Nenhuma alteração no Supabase compartilhado foi realizada.** Não houve SQL remoto, migração, novo projeto, escrita de registro, alteração de Auth/RLS/Storage/grants/API, criação de usuário ou intervenção em outra aplicação. Nenhuma publicação em produção ou merge.

## Próxima etapa — 03C

1. Revisar visualmente e aprovar o recorte funcional demonstrado.
2. Confirmar bases legais, retenção, responsabilidades, projeção gerencial exportável e exceções administrativas de acesso.
3. Fazer inventário técnico somente de leitura e especificar a integração incremental no mesmo projeto compartilhado, preservando autenticação/autorização e separação pessoa/vínculo/conta.
4. Produzir proposta revisável de objetos, constraints (um ativo e períodos sem sobreposição), permissões por operação, RLS por organização/linha/campo, vigência, revisão sem autoaprovação, auditoria e recuperação granular. SQL somente documental até autorização específica.
5. Validar localmente com dados sintéticos; solicitar autorização específica para qualquer execução remota. Aprovar telas não autoriza mudar o banco, fazer merge ou publicar em produção.
