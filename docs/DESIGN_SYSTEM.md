# Design system — Etapa 02

Evolução incremental da fundação Next.js 16.4.1. Mantém a marca tipográfica existente, sem criar logomarca ou carregar fontes externas. A identidade oficial continua pendente de fornecimento.

## Tokens

`src/app/globals.css` é a fonte de cores semânticas: fundo `#f7f7f5`, texto `#202020`, cards brancos, sidebar `#181a18`, ação/foco `#c94409`, apoio laranja `#fff0e7`, erro `#b42318`, divisórias `#e5e5e0`. Branco sobre a ação principal e texto escuro sobre superfícies claras preservam o contraste. Laranja claro é decorativo na sidebar escura.

Tipografia local Segoe UI/Arial/Helvetica, títulos 30–36 px nas páginas e texto principal 14 px. Espaçamento na escala Tailwind de 4 px, padding de página 20/40 px. Tokens de largura da sidebar: 272/88 px. Raio de superfície 16 px, controles 12 px e sombra de superfície `0 2px 8px rgb(24 26 24 / 3%)`. `--space-page` fica disponível para novos layouts.

## Componentes e contratos

| Componente | Padrão |
| --- | --- |
| Button | Primário, secondary, outline, ghost e destructive; foco visível e disabled; asChild para links reais |
| Input, Select, Textarea | Label associado pelo consumidor, foco, erro via aria-invalid e disabled |
| Checkbox, Radio | Controles nativos; label e agrupamento fieldset/legend pelo consumidor |
| Combobox | Sugestões nativas via datalist; aceita texto livre e não garante pertencimento ao catálogo; validar no servidor quando necessário |
| Badge | Disponibilidade e metadados, sem aparência de botão |
| Card | Superfície branca, borda sutil, raio e sombra compartilhados |
| PageHeader | Eyebrow, título, descrição e metadados opcionais |
| EmptyState | Ícone Lucide, disponibilidade, título e descrição verdadeira; nunca sugere dados inexistentes |
| Alert | Informação, confirmação/sucesso e erro; role status/alert |
| Skeleton | Elemento decorativo aria-hidden; contêiner anuncia carregamento |
| Table | Região rolável acessível por teclado, caption obrigatório e estilos de cabeçalhos/células; sem dados conectados nesta etapa |
| LinkTabs | Abas de navegação por rotas, links reais e aria-current; não simula tabpanel |
| Disclosure | Menu nativo details/summary, fecha ao clicar fora ou Escape, devolve foco ao summary |
| SidebarFrame | Navegação recolhível e drawer móvel com dialog nativo modal, Escape e restauração de foco |
| Breadcrumbs | Localização da página com início, gestão e dashboard |

Ícones Lucide existentes; decorativos devem usar aria-hidden e botões só com ícone precisam de nome acessível. Links mantêm destino real. Módulos futuros são texto com “Em breve”, sem ação falsa. Menu do usuário mantém logout e troca de organização pelas Server Actions existentes.

## Padrões futuros sem funcionalidades operacionais

Filtros devem agrupar controles rotulados em fieldset, com botão de aplicação apenas quando houver filtragem real. Formulários devem usar Input/Select, mensagens de erro próximas e Alert para resultado. Listagens devem usar Table, caption e cabeçalhos com scope; estados vazios não devem substituir zero por números fictícios.

Modais de operação e confirmações futuras devem seguir o dialog nativo do drawer: nome acessível, foco contido, Escape e retorno ao acionador. Não há ação operacional que exija modal de confirmação nesta entrega. Tooltips devem complementar rótulos, nunca esconder informação essencial; os ícones da sidebar recolhida preservam aria-label e title nativo. Não se adicionou biblioteca de overlays nem componentes complexos sem uso.

## Navegação e acesso

Área geral: Início. Gestão de pessoas: Gente & Gestão e Dashboard gerencial apenas conforme permissões reais. Próximos espaços: Comunicação, Desenvolvimento, Academy e Cultura. A navegação apenas reflete permissões; guardas no servidor e RLS continuam obrigatórias e intactas.

Header e Meu Espaço distinguem nome, vínculo contratual e papéis acumuláveis. Profissional e Diretoria podem ser papéis simultâneos, rotulados explicitamente como papéis; CLT/estágio/PJ são vínculo. Nenhum benefício trabalhista é anunciado a PJ.

## Responsividade e acessibilidade

Sidebar desktop a partir de 1024 px, com conteúdo rolável em telas baixas; drawer modal abaixo desse limite. Cards de acesso adaptam-se em 1/3 colunas e módulos futuros em 1/2; bloco pessoal passa para a coluna lateral somente em telas largas. Menus limitam largura ao viewport. Foco visível global, navegação por teclado, landmarks e link de pular navegação existente. Respeito a prefers-reduced-motion.

Validação automatizada e limitações em [STAGE_02_DELIVERY.md](STAGE_02_DELIVERY.md).

## Refinamento 02.1 — minimalismo premium

A composição atual substitui os cards repetitivos por acessos em linhas dentro de uma única superfície, ao lado do painel Meu Espaço. O destaque institucional utiliza linhas geométricas discretas com referência à arquitetura, sem imagens ou gradientes. Comunicação é uma nota editorial compacta; três módulos futuros ficam em uma faixa sem ações. Nenhum dado ou indicador foi acrescentado.

Tokens atuais: sidebar 248/76 px, header 68 px, conteúdo máximo 1280 px, superfícies com raio 14 px. Títulos fluidos 28–36 px com tracking -0.045em; labels 10–11 px, corpo 12–14 px. Estados vazios limitados a 760 px, horizontais no desktop, transparentes e com borda tracejada. Microinterações de 160/200 ms em hover, clique e recolhimento; prefers-reduced-motion desativa movimento. Skeleton acompanha as novas proporções.

Próximos espaços na sidebar ficam em disclosure nativo, fechado por padrão; no modo recolhido ficam ocultos por serem indisponíveis. Links reais mantêm aria-label e title com o nome completo. Organização quebra linhas sem truncamento. O header reduz a repetição de papéis; o menu mantém a separação de vínculo e papéis acumulados.

A origem do nome é `profiles.display_name`, com fallback legado “Profissional” em `modules/access/server.ts`. O helper de apresentação `personalName` trata esse fallback, vazio e espaços como ausência: Home usa “Bom ter você aqui.” e perfil usa “Minha conta” com ícone neutro. Nenhuma consulta ou regra de acesso foi alterada.
