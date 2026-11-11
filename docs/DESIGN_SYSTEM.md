# Design system inicial

A marca aparece em tipografia como espaço reservado. Não foi criada logomarca. Cores oficiais e fontes poderão substituir os tokens sem reescrever os componentes.

| Token              | Valor     | Uso                              |
| ------------------ | --------- | -------------------------------- |
| background         | `#f7f7f5` | Fundo da plataforma              |
| foreground         | `#202020` | Texto principal                  |
| card               | `#ffffff` | Superfícies                      |
| sidebar            | `#181a18` | Navegação e áreas institucionais |
| primary/ring       | `#c94409` | Ações e foco                     |
| primary-foreground | `#ffffff` | Texto de ações                   |
| accent             | `#fff0e7` | Destaque leve                    |
| accent-foreground  | `#a43509` | Texto sobre destaque             |
| muted              | `#f1f1ee` | Superfícies de apoio             |
| muted-foreground   | `#686864` | Texto secundário                 |
| border             | `#e5e5e0` | Divisórias                       |
| input              | `#d5d5d0` | Campos                           |
| destructive        | `#b42318` | Erros                            |

Definições em `src/app/globals.css`, mapeadas ao tema do Tailwind. Tipografia de sistema Arial/Helvetica, sem dependência de fontes externas; títulos 24–60 px conforme contexto, texto 14–16 px e notas 10–12 px. Escala de espaçamento nativa Tailwind em passos de 4 px, containers com padding 20/40 px e raio base 12 px. Componentes shadcn/ui locais: Button com variantes default/outline/ghost; Input com foco/erro/desabilitado; Card com título e conteúdo.

Foco visível, labels, autocomplete, botão para mostrar senha, mensagens com `role=alert/status`, link para pular navegação e landmarks. Layout usa grid flexível; menu mobile nativo via `details`, sem biblioteca de navegação adicional. Recursos indisponíveis têm rótulo “Em breve”, sem links ou métricas simuladas. Estados skeleton, vazio, falha recuperável, 404 e acesso negado são explícitos.
