# Home Office — demonstração local

Rota `/home-office`, categoria Pessoas, com Escalas, Relatórios e Regras. A interface preserva os componentes e a identidade visual anteriores e reutiliza o modal de jornadas e a persistência local IndexedDB.

## Escalas

Calendário mensal com seleção de data, filtros por setor/liderança/profissional e painel do dia. Acordos RH/Diretoria têm vigência, dias habituais e período (Manhã, Tarde ou Dia completo). Remoto permanente é dispensado de relatório; híbrido fixo gera obrigações por ocorrência. Dias habituais são configuráveis; permanente inicia com segunda a sexta.

RH e liderança, dentro de seus escopos, registram combinados previamente autorizados por outro canal, com data, período, justificativa e autoria obtida da sessão. Não há integração com WhatsApp. O profissional sinaliza apenas suas datas, inicialmente pendentes. Sinalizações não geram obrigação antes da confirmação. Confirmações retroativas são bloqueadas.

Troca/cancelamento afeta somente uma ocorrência. Dias posteriores da recorrência continuam válidos. Colisões com outras escalas/sinalizações e sobreposições de acordos são bloqueadas. A dispensa do permanente continua nas trocas e em combinados durante sua vigência. Acordos podem ser encerrados de hoje em diante pelo RH, preservando datas anteriores.

Decisões conservadoras: cadastros e alterações operacionais começam hoje ou no futuro; não é permitido apagar obrigações atrasadas por cancelamento retroativo. Registros com original enviado não podem ser cancelados. Rascunhos cancelados permanecem em histórico, sem obrigação ativa. Uma data que já possui relatório materializado não pode ser reutilizada por outra escala, evitando sobrescrever seu histórico.

## Relatórios

A obrigação é derivada da escala autorizada; não existe cadastro avulso. Um único relatório por pessoa/organização/data, com atividades por período, projeto/demanda, trabalho realizado, resultado e referência HTTP(S) opcional. Pendência sinalizada exige explicação. Valida campos concretos, sem pontuar produtividade ou usar contagem de palavras como garantia de qualidade.

Rascunho e original somente no próprio dia, até o fim do minuto 23h59 de `America/Sao_Paulo`. Funções de domínio recebem uma data de referência para os testes, enquanto ações da interface consultam o relógio corrente do navegador. A interface atualiza os estados periodicamente; cada comando revalida o prazo ao executar. Bloqueia originais antecipados, atrasados e sobrescrita do original.

No dia seguinte, ausência de original permanece “Não entregue no prazo”. Justificativas são notas separadas e não convertem o atraso em entrega pontual. Envio e revisão têm estados distintos.

Revisão sequencial: liderança responsável confere, depois RH/Diretoria valida. Não permite pular etapas nem autovalidar. A liderança não faz a validação de RH; RH não substitui a conferência da liderança nesta versão. Relatórios próprios de gestores aguardam outro aprovador autorizado. Como as sessões demonstrativas não se sincronizam, existem exemplos já preparados nas diferentes etapas para cada perfil testar.

Comentários e pedidos de esclarecimento registram autor/data. A complementação é feita pelo próprio profissional, inclusive depois do dia original, retorna à etapa que pediu esclarecimento e preserva integralmente o original e seu horário. Não há alteração de ponto, cálculo de horas ou comprovante de jornada.

## Regras e acesso

RH edita o texto e publica nova versão. Acordos, ocorrências e relatórios existentes guardam a versão de origem; novos registros usam a versão atual. O texto editorial não reprograma o motor da demonstração, inclusive o prazo de envio. Histórico e leitura das versões anteriores permanecem disponíveis.

A sessão, organização, usuário e papel vêm das guardas existentes. `home.view` continua necessário. RH/Diretoria só recebem modo gerencial quando possuem `people.management.view` e o papel correspondente. Liderança recebe sua equipe e seus próprios registros. Profissionais recebem somente seus dados. A projeção ocorre antes da serialização no servidor e novamente ao carregar o armazenamento local. Comandos conferem organização, autoria e escopo; parâmetros dos formulários não substituem o principal autenticado. Não há seletor de perfil ou bypass de login.

Fixtures vinculam apenas uma pessoa fictícia à conta autenticada para demonstrar “minha escala”. As demais pessoas, equipes e relações de liderança são fictícias e não representam atribuições reais da Base Central.

## Persistência e limites

IndexedDB `youcon-demo-v1`, store `demos`, chave `home-office-v1:<organização>:<usuário>:<perfil>`. Não compartilha registros com Onboarding, Offboarding ou documentos. O botão Restaurar demonstração descarta apenas os testes deste módulo/contexto, mediante confirmação.

Dados locais sobrevivem ao reload, sem sincronização entre contas, abas, dispositivos ou origens. Armazenamento indisponível/quota excedida exibe aviso; nesse caso, alterações podem permanecer apenas na sessão. Use exclusivamente dados fictícios.

O relógio do navegador é modificável: o bloqueio de prazo é demonstrativo, não uma garantia contra fraude. A futura persistência real exige validação autoritativa no servidor, controle transacional e trilha de auditoria. Nenhuma dessas integrações remotas foi executada. Não existem mensagens, notificações externas, ponto, folha, WhatsApp, monitoramento de tela, localização ou teclado.

## Validação

- TypeScript, lint e build Next.js com URL/chave sintéticas de loopback.
- Vitest: 134 testes aprovados, incluindo 25 testes de Home Office. Casos de recorrência, vigência, dispensa, sinais pendentes, aprovação, duplicidade, troca, cancelamento, períodos, meia-noite em Brasília, conteúdo, impedimentos, links, original imutável, atraso, complementação, duas etapas de revisão, autovalidação, escopo, organização e regras versionadas.
- Navegador Chromium com Auth/Data API fictícios em `127.0.0.1`: `RUN_BUILT_APP=1 node tests/browser/home-office.mjs`. Rascunho após reload, envio original, justificativa e complementação sem apagar o original, revisões, regras, acordos permanentes, confirmação de datas, trocas, filtros, acesso por perfil, teclado e mobile.
- Regressões: `tests/browser/onboarding.mjs`, `tests/browser/offboarding.mjs` e `tests/browser/people.mjs`. A API sintética rejeita métodos diferentes de GET; nenhum teste usa o Supabase compartilhado.

Capturas com conta/organização sintéticas: [calendário](review/calendar.png), [relatórios](review/reports.png), [validação](review/review.png), [regras](review/rules.png), [mobile](review/mobile.png).
