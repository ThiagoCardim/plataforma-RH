# Etapa 03B — decisões consolidadas

13/11/2026. Regras aprovadas pelo usuário no pedido desta etapa. Este documento prevalece sobre propostas conflitantes da Etapa 03A, que permanece como registro histórico. A aprovação abrange as interfaces demonstrativas; não autoriza escrita, configuração, grants ou permissões no Supabase.

| ID | Regra consolidada | Aplicação nesta entrega |
| --- | --- | --- |
| D01 | Usar versão mais recente, preservando Etapa 02.1 | Branch feat/youcon-people-stage-03b criada de 657a467, que contém 7a260ed. PRs #1/#2 preservados sem merge |
| D02 | Isolamento por organização | Guardas de servidor existentes; estado local por usuário/organização, busca/ficha/edição limitadas ao escopo. Recarregar descarta tudo |
| D03 | Pessoa, vínculo e conta separados | Contrato de dados independente; cadastrar exemplo não cria login nem membership |
| D04 | Apenas um vínculo ativo por pessoa/organização | Sem seleção de simultâneos. Histórico com contratos encerrados e reingresso; validação de sobreposição em períodos inclusivos. Reingresso operacional fica para 03C |
| D05 | RH e Diretoria podem consultar, cadastrar e editar | Ambos usam a interface e simulações em memória; nenhuma permissão remota de escrita foi concedida |
| D06 | Cadastro inicial enxuto | Nome completo, tipo/início, cargo ou função, setor e unidade. Código gerado. Nome de exibição, contato profissional, liderança e detalhe contratual opcionais. Sem CPF, nascimento, endereço, documentos ou dados financeiros |
| D07 | Diretoria aprova excepcionalmente pedidos de profissionais do RH; nunca autoaprovação | Regra documentada e apresentada na seção Acesso; sem fila ou aprovação operacional nesta etapa. Não amplia people.management.view para aprovar |
| D08 | Liderança e histórico de mudanças | Responsável por vínculo, rótulo contratual para PJ; exemplos e eventos locais de alterações. Catálogo de responsáveis validado e versões efetivas ficam para integração |
| D09 | Encerramento revoga somente acesso People, com exceção administrativa documentada | Exemplo encerrado mostra acesso bloqueado; texto da exceção e impacto. Nenhuma revogação real, exclusão Auth ou logout global |
| D10 | Cadastrar pessoa sem login, sem criação automática de conta | Novo exemplo usa situação “Sem conta de acesso”. Nenhuma chamada Auth no módulo people |
| D11 | Minimização; retenção/proteção ainda precisam de validação | Dados fictícios somente em memória React, sem localStorage/sessionStorage/IndexedDB/cookie para cadastro. Prazos e fundamentos legais permanecem pendentes de RH/jurídico antes da coleta real |
| D12 | Diretoria exporta somente gerencial autorizado | Não existe botão de download ou exportação funcional. Contato privado/documento/banco/sensíveis excluídos do contrato de UI; projeção gerencial será especificada na 03C |
| D13 | Duplicidades por revisão manual | Mesmo nome normalizado na organização gera aviso e exige confirmar revisão; não identifica automaticamente a mesma pessoa nem faz fusão |
| D14 | Vínculo principal vigente no perfil, com histórico | Resumo da ficha mostra o único vigente; contratos anteriores ficam em Histórico. Sem seletor de simultâneos. Menu da conta autenticada continua usando estrutura de acesso existente, sem ligá-la a uma pessoa fictícia |
| D15 | Priorizar cadastro, listagem, ficha e histórico | Telas implementadas com edição local. Solicitações/decisões, encerramento/reingresso interativo, exportação e integração real ficam para próxima etapa |

## Validação futura da aprovação excepcional

Uma decisão sobre solicitação cadastral deverá exigir ator e solicitante distintos. RH revisa pedidos comuns dentro da sua organização. Diretoria só recebe a capacidade excepcional quando o pedido tiver sido realizado por profissional do RH, com verificação confiável dessa condição na submissão e na decisão, motivo obrigatório e trilha de auditoria. Mudança de papel não pode criar autorização retroativa silenciosa. Não permitir que solicitante declare seu próprio papel. Se não houver revisor elegível, manter pendente e encaminhar à governança; não autoaprovar. Pedidos próprios de um diretor que também tenha RH continuam sujeitos à proibição de autoaprovação.

## Pendências para 03C

- Validar bases legais e prazos de retenção, responsabilidades e projeções privadas/gerenciais.
- Definir governança das exceções de acesso após encerramento, prazo e revisão periódica.
- Definir seleção validada do responsável, vigências e referências organizacionais.
- Especificar a transição entre memberships.contract_type legado e o contrato cadastral sem romper a autorização atual.
- Preparar desenho técnico e SQL apenas documental, com impacto e recuperação granular para revisão. Nenhuma alteração remota é autorizada pelo aceite das telas.
