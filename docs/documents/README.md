> Atualização: a central agora é **Políticas e Compliance** (`/politicas-compliance`), com persistência demonstrativa no navegador. As URLs antigas redirecionam. Para o comportamento atual, limites e validações, consulte [Onboarding e central unificada](../onboarding/README.md). O relato abaixo registra a entrega anterior em memória.

# Central demonstrativa de documentos

Políticas Internas (`/politicas-internas`) e Compliance (`/compliance`) usam os mesmos componentes, com bibliotecas independentes. Esta entrega é uma experiência funcional com dados fictícios e estado em memória, sem persistência de documentos no Supabase.

## Recursos disponíveis

- Tabela e cards; pesquisa pelo título; filtros combináveis por categoria, público e status; limpeza de filtros e estado vazio.
- Criação, edição, duplicação como rascunho e arquivamento confirmado.
- Editor por blocos: título, texto, lista, tabela (colunas separadas por `|`), imagem local e link HTTP(S). Inclusão, remoção e reordenação de blocos, com pré-visualização formatada.
- Bloco Arquivo na barra do editor: PDF, Word e outros formatos, até 10 MB por arquivo. Pode ser intercalado e reordenado com os demais blocos, substituído ou removido. O cartão mostra nome, formato e tamanho; oferece download e visualização de PDF/imagens compatíveis. Outros formatos são baixados. Não há upload remoto. Anexos de versões anteriores são apresentados como blocos ao final do conteúdo, preservando o histórico.
- Categorias livres, etiquetas personalizadas, públicos CLT/Estágio/PJ e cinco estados: Rascunho, Em revisão, Em implantação, Ativa e Arquivada.
- Página individual, histórico de versões com autor/data/campos alterados e visualização de versões anteriores. Edição de documento ativo começa como rascunho e mantém a versão publicada anterior até nova publicação.
- Confirmação de leitura simulada por versão. Salvar uma nova versão reinicia a confirmação local.
- Doze documentos fictícios iniciais, seis por biblioteca, cobrindo todos os estados e diferentes públicos. Exemplos: trabalho remoto, convivência, comunicação, integração, despesas, segurança, conduta, conflitos de interesse, privacidade, fornecedores, ética e presentes.

## Acesso

As guardas existentes de autenticação, organização e vínculo continuam em uso. O módulo exige `home.view`. Apenas RH/Diretoria com `people.management.view` recebem conteúdo editorial e comandos de gerenciamento. Profissionais e lideranças recebem somente a projeção publicada dos documentos destinados ao tipo de contrato do vínculo atual. Rascunhos, histórico e documentos de outros públicos não são serializados para leitores. Rotas de criação também têm guarda de servidor.

Etiquetas são classificadores; não concedem acesso. A organização e a identidade vêm do contexto validado no servidor, nunca de parâmetros do editor. A troca de usuário/organização remonta o estado da demonstração. Nenhuma permissão global foi modificada. Os links das bibliotecas ficam disponíveis aos leitores conforme o escopo deste módulo; a Base Central e o Dashboard continuam restritos.

O corpo usa blocos estruturados e texto escapado pelo React; não aceita HTML arbitrário. Links aceitam apenas HTTP(S); imagens e anexos locais usam URLs `blob:` revogadas quando a sessão da biblioteca é desmontada.

## Limites da demonstração

Documentos, versões, anexos e confirmações existem exclusivamente na memória do navegador. Recarregar, sair da área de bibliotecas ou trocar o contexto pode descartar as alterações. Não há sincronização entre usuários, abas ou dispositivos. Uma publicação simulada não é transmitida a outra sessão; os leitores recebem os exemplos publicados iniciais. Utilize somente arquivos fictícios.

As versões e confirmações demonstrativas não são trilhas de auditoria oficiais. Uma futura persistência precisa de autorização separada e validação das operações no servidor, armazenamento seguro, políticas por organização/público, controle transacional de versões e registros de leitura. Este módulo não adiciona migrations, tabelas, Storage, funções remotas ou ações de escrita.

## Validação

- `npm run lint`, `npm run typecheck` e suíte Vitest: 92 testes aprovados.
- Build Next.js otimizado aprovado usando URL/chave sintéticas de loopback.
- `RUN_BUILT_APP=1 node tests/browser/people.mjs`: navegador Chromium com Auth/Data API fictícios em `127.0.0.1`, sem conexão ao Supabase compartilhado. Testa regressão de Pessoas/navegação, papéis, público, bloqueio de criação para leitores, filtros, cards, blocos, anexos, publicação, edição, versões, duplicação, arquivamento, confirmação de leitura e responsividade. A API sintética rejeita qualquer método diferente de GET.
- Auth, clientes Supabase, proxy, permissões existentes, SQL e dependências preservados. Nenhum merge ou publicação em produção.

Capturas locais com conta e organização sintéticas: [tabela](review/library.png), [cards](review/cards.png), [documento](review/document.png) e [mobile](review/mobile.png).
