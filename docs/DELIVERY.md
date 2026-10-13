# Entrega — Fundação técnica

## Implementado

Etapa 01 concluída em código: projeto Next.js App Router/TypeScript estrito, Tailwind e componentes shadcn/ui locais; login real preparado para Supabase Auth; sessão SSR e cookies renovados no proxy; guardas de identidade e permissões por rota; layout responsivo; Home contextual; navegação por papel; estrutura multi-organização; migração e RLS; estados de loading, vazio, falha e acesso negado; documentação e testes.

A Home usa somente organização, perfil mínimo, vínculo e papéis da sessão real. Não há indicadores fictícios. Base gerencial e dashboard são espaços vazios exclusivos de RH/Diretoria. Os módulos futuros não foram implementados.

## Verificações executadas

| Verificação                                              | Resultado                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `npm run lint`                                           | Passou, sem avisos                                         |
| `npm run typecheck`                                      | Passou, TypeScript estrito                                 |
| `npm test`                                               | Passou, 25 testes em 3 arquivos                            |
| `npm run build`                                          | Passou, build otimizado Next.js com Webpack                |
| `git diff --check`                                       | Passou                                                     |
| HTTP `/login` sem Supabase                               | 200, estado Acesso em preparação e formulário desabilitado |
| HTTP `/home`, `/gente-gestao`, `/gente-gestao/dashboard` | 307 para `/login` sem sessão/configuração                  |
| HTTP `/acesso-negado`                                    | 200                                                        |
| HTTP rota inexistente                                    | 404                                                        |
| Cache das respostas de login e protegidas                | `private, no-store`                                        |

O primeiro build com Turbopack falhou por restrição de portas internas do ambiente. O projeto passou a usar Webpack. Uma tentativa intermediária de build teve falha ao coletar o resultado do TypeScript; o build final completo passou após a execução com permissões adequadas do ambiente.

SQL/RLS validado por execução da migração no PostgreSQL PGlite: acesso profissional/CLT, estágio e PJ, bloqueio de liderança, RH e Diretoria, isolamento de organizações, leitura de perfil próprio, vínculo inativo, grants de escrita negados, constraint de papéis gerenciais, FK composta, acumulação de papéis e revogação sem refresh de claims.

Não houve teste visual em navegador: a sessão não disponibiliza ferramenta de navegador/preview. Responsividade e acessibilidade foram revisadas no código, mas exigem validação visual nos dispositivos alvo. Login/logout/renovação com Supabase hospedado e advisors remotos ainda não foram executados, pois não há projeto selecionado nem credenciais configuradas. A consulta ao changelog Supabase por HTTP foi bloqueada pela política de destinos; a implementação de SSR foi conferida na documentação atual via ferramenta Supabase `search_docs`.

## Configurações e pendências

- Projeto Supabase de desenvolvimento, URL e chave publishable em `.env.local`.
- Aplicar migração e configurar Auth remoto com signup e login anônimo desabilitados.
- Provisionar organização, usuário Auth e vínculo/papéis por operador autorizado.
- Validar fluxo Auth real, RLS pela Data API e advisors no projeto alvo.
- Fornecer identidade visual oficial e validar telas em desktop, tablet e celular.
- Configurar Vercel apenas quando a implantação de preview for solicitada; nenhuma produção publicada.
- Fluxos de convite, definição/recuperação de senha na aplicação e eventual MFA ainda não fazem parte desta etapa.

## Próximos passos

Revisar e testar a fundação no ambiente Supabase de desenvolvimento; revisar o PR sem merge automático. Depois, definir e autorizar separadamente o próximo módulo. Cadastro completo de pessoas, importações e demais módulos continuam fora do escopo.

## Arquivos

O inventário completo está em [FILES.md](FILES.md); o README existente foi substituído pela documentação do projeto. Código, migração, testes e configurações estão na branch `feat/youcon-people-foundation`.

## Status do versionamento

Branch `feat/youcon-people-foundation` preparada para PR em rascunho, sem merge ou publicação. O bloqueio inicial do envio foi documentado; posteriormente o usuário autorizou explicitamente enviar esta branch para `ThiagoCardim/plataforma-RH` e criar o PR. A descrição está em [PULL_REQUEST.md](PULL_REQUEST.md).

Na revisão final, `AGENTS.md` foi incluído conforme a recomendação do Next.js. `next-env.d.ts` foi removido do versionamento e adicionado ao `.gitignore`, pois seus imports variam entre desenvolvimento e build. `npm run typecheck` agora executa `next typegen` antes do TypeScript, preparando também um checkout novo. Nenhum artefato `.next`, credencial, segredo ou dado real de pessoa está incluído.
