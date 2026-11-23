# Navegação YouCon People — 23/11/2026

Reorganização sobre 829f48f, preservando o código aprovado da Base Central 03B e a documentação SQL 03C. Não há integração de persistência ou alteração no Supabase nesta entrega.

## Estrutura

Início permanece na área geral. Colaboradores substitui o rótulo Gente & Gestão, preservando `/gente-gestao` e todo o subtree `/gente-gestao/pessoas`: listagem, cadastro, ficha, edição, histórico e demonstração em memória. Home, breadcrumbs e metadados usam a nova identificação. O Dashboard Gerencial permanece em seção própria e mantém `/gente-gestao/dashboard`.

| Grupo | Página | URL | Estado |
| --- | --- | --- | --- |
| Pessoas | Colaboradores | /gente-gestao → /gente-gestao/pessoas | Funcionalidades demonstrativas existentes preservadas |
| Pessoas | Onboarding e Offboarding | /onboarding-offboarding | Página inicial navegável |
| Pessoas | Plano de Carreira | /plano-de-carreira | Página inicial navegável |
| Pessoas | Home Office | /home-office | Página inicial navegável |
| Desempenho | Avaliação de Desempenho | /avaliacao-de-desempenho | Página inicial navegável |
| Desempenho | Metas dos Líderes | /metas-dos-lideres | Página inicial navegável |
| Desempenho | YouCon Academy | /youcon-academy | Página inicial navegável |
| Políticas | Cultura | /cultura | Página inicial navegável |
| Políticas | Compliance | /compliance | Página inicial navegável |
| Políticas | Políticas Internas | /politicas-internas | Página inicial navegável |
| Políticas | Programa de Indicação de Vagas | /programa-de-indicacao-de-vagas | Página inicial navegável |
| Visão gerencial | Dashboard Gerencial | /gente-gestao/dashboard | Página gerencial existente preservada |

As dez páginas iniciais têm título, descrição específica, estado “Em preparação” e retorno ao Início. Estão prontas para receber funcionalidades, sem controles ou dados que simulem módulos operacionais inexistentes. Comunicação e outros módulos históricos em planejamento não foram implementados por consequência desta reorganização.

## Permissões e implementação

Colaboradores continua exigindo `people.management.view`; Dashboard exige `people.dashboard.view`, de forma independente. As páginas novas usam conservadoramente a mesma guarda gerencial de Colaboradores. Elas não recebem uma autorização nova para Profissional/Liderança por apenas aparecerem na estrutura solicitada. A eventual liberação de módulos a outros papéis deverá ser definida com as funcionalidades futuras.

As verificações ocorrem no servidor, também para acesso direto por URL. Catálogo, títulos/breadcrumbs e ícones são compartilhados em src/modules/navigation; o estado inicial é reutilizável sem consultas adicionais ao banco. A sidebar mantém largura 248/76 px, cores, tipografia, foco, menu móvel, rolagem e comportamento de recolher já existentes. Ícones recolhidos mantêm rótulo acessível e tooltip nativo. Dashboard não ativa Colaboradores ao mesmo tempo.

Nenhum diff em políticas de acesso, clientes Supabase, proxy, ações Auth, schemas/SQL, dependências ou lockfile. Nenhum cadastro real, alteração de Auth, RLS, Storage, permissões ou configuração do banco. Sem merge ou publicação em produção.

## Validação

Ajuste pontual posterior: Desempenho mantém suas três opções; Compliance e Políticas Internas possuem páginas independentes sob a mesma guarda. Lint, typecheck e os 24 testes específicos de navegação/acesso passaram. Os resultados abaixo registram a validação da reorganização inicial.

- Lint e typecheck aprovados.
- 87 testes em 10 arquivos aprovados, incluindo 22 casos da navegação/guardas dos novos módulos. Após corrigir a extensão do import dinâmico do teste, os 22 casos específicos passaram novamente sem o aviso do Vite.
- Build Next.js 16.4.1 Webpack aprovado; todas as dez rotas são dinâmicas e autenticadas.
- Chromium na aplicação compilada, com Auth/Data API sintéticos exclusivamente em loopback: RH e Diretoria abrem todas as páginas pelo menu; Profissional e Liderança são bloqueados por acesso direto; anônimo redireciona ao login.
- Regressão de Colaboradores: busca, filtros combinados, paginação, formulário/validações, campos CLT/estágio/PJ, edição, histórico, descarte no reload e isolamento do contexto de organização.
- Menu aberto/recolhido, destaque ativo, breadcrumbs e menu móvel, navegação até o Dashboard e Escape com retorno de foco. Sem erros JavaScript nos fluxos finais. Larguras 360/390/768/1024/1440 px sem overflow horizontal da página.

Reprodução: o teste existente tests/browser/people.mjs foi estendido para os novos caminhos. Usar a configuração de loopback e `RUN_BUILT_APP=1` documentadas na entrega 03B. O teste não fornece um bypass de autenticação na aplicação e não comprova sessões reais hospedadas. Screenshots usam conta, organização e pessoas fictícias. Nenhum dado pessoal do banco foi consultado para esta revisão visual.

## Capturas

As capturas abaixo registram a primeira reorganização. Após os ajustes de rótulos, a categoria passa a Desempenho, com Compliance e Políticas Internas separados. A URL anterior /compliance-e-politicas redireciona para /compliance, preservando a guarda gerencial.

- [Menu desktop e página inicial](review/menu-desktop.png)
- [Colaboradores preservado](review/colaboradores-desktop.png)
- [Menu móvel](review/menu-mobile.png)
- [Página inicial no celular](review/pagina-mobile.png)
