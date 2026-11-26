# Processo Seletivo — controles locais do RH

Escopo: correção da página `/recrutamento/processo-seletivo`. Não modifica Supabase, Auth, RLS, grants, produção ou portal operacional. Sem migrations ou merges.

## Perfil e demonstração

O escopo real continua vindo da autenticação e da organização autorizada no servidor. O código anterior ocultava as mutações para Diretoria e liderança: somente `scope.rh` administra o recrutamento. A página agora explica o perfil autenticado; não é necessário consultar dados pessoais reais para diagnosticá-lo.

A ação **Testar RH com dados fictícios**, solicitada expressamente nesta correção, abre uma demonstração isolada nesta página. A guarda de autenticação e acesso ao Processo Seletivo executa antes da criação do ator demonstrativo. Mantém usuário/organização reais como namespace, cria exemplos novos exclusivamente fictícios e usa a chave `recruitment-v1:selection-rh-demo:<organização>:<usuário>:<papéis>:<vínculo>`. Não lê nem copia o armazenamento da experiência real. Não cria papéis, contas ou permissões; não altera o menu nem autoriza outras rotas. Profissionais sem acesso e visitantes continuam bloqueados. Voltar ao perfil real restaura o escopo original. A query de demonstração é ignorada nas demais páginas e suas guardas continuam funcionando.

Os dados locais são demonstrativos e podem ser inspecionados pelo próprio navegador: essa simulação não constitui um mecanismo de autorização para dados reais. Dados e arquivos permanecem somente no navegador; não há sincronização nem disparos reais.

## Controles

- **Configurar Kanban**: fases, aparência dos cards, formulário de currículos e campos da ficha.
- Fases: adicionar, renomear, editar cor/prazo/campos, subir/descer e excluir. Os menus de cada coluna também abrem a configuração.
- Excluir fase exige destino e confirmação explícitos, mesmo quando há referências arquivadas. Cards, valores, resultados, admissões e vínculos são preservados. Snapshots e histórico originais permanecem; referências históricas/arquivadas conservam suas datas e visitas. Automações mantêm identidade e configuração e passam a apontar ao destino, sem execução retroativa. Movimentações futuras continuam disparando as regras existentes.
- Funções essenciais de entrada, contratação e recusa são conservadas: ao excluir uma dessas fases, escolha outra sem função essencial conflitante, que herdará a função. É possível criar uma fase de destino antes da transferência. Não se substitui silenciosamente outra função essencial.
- Cards: abrir ficha, editar cadastro/evidências/cor individual, mover por arrastar e soltar ou por seletor acessível e excluir do quadro. As fases podem ser puladas. Um card formalizado pode ser reorganizado visualmente sem desfazer contratação/admissão/vínculo.
- Excluir card remove do quadro e conserva currículo e histórico com registro de exclusão local; **Excluir dados fictícios** é uma ação separada de anonimização, mediante justificativa e confirmação. Não executa desligamentos.
- Cadastro manual usa a entrada e os controles de duplicidade existentes. Nenhuma unificação é automática. Respostas adicionais de cadastros duplicados permanecem na revisão correspondente.
- Aparência: cor padrão ou individual e escolha de campos visíveis, incluindo campos personalizados. Ficha: adicionar/remover/reordenar campos, alterar rótulos/tipos/opções/obrigatoriedade/condições. Nome e e-mail continuam obrigatórios e mapeados uma única vez. Remover uma definição não elimina valores anteriores. Definições anteriores são conservadas no histórico local.
- Formulário: construtor e prévia existentes, com novas versões; respostas e snapshots recebidos anteriormente não são reescritos.
- Componentes compartilhados recebem apenas propriedades opcionais usadas nesta página; os demais módulos mantêm seu comportamento anterior.

## Validação proporcional

Dados e APIs de autenticação exclusivamente sintéticos em loopback. Nenhuma fixture remota.

- 96 testes de modelo/navegação: `recruitment-selection`, `recruitment-workflow`, `recruitment-resumes`, `recruitment-navigation`.
- Navegador: `tests/browser/recruitment-selection.mjs`, `recruitment.mjs` e `recruitment-resumes.mjs`. CRUD, transferência de fase ocupada, histórico/automações, personalização, cadastro manual, anonimização, recarga, isolamento da demonstração RH, guardas, responsividade e teclado. Regressões do fluxo de recrutamento, currículos e passagem existente para admissão/Onboarding/Offboarding. APIs sintéticas rejeitam qualquer método diferente de GET.
- ESLint sem avisos; TypeScript e build Next com configuração sintética local; revisão React/acessibilidade e `git diff --check`.

A homologação segue [PREVIEW.md](PREVIEW.md): somente o alias fixo, após verificar checks, SHA/branch, projeto/equipe, Preview READY e proteção existente. A versão anterior permanece disponível para recuperação. Não gerar links de bypass nem alterar produção.
