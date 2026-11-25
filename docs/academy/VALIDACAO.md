# Validação da Academy

## Ambiente

Dados exclusivamente fictícios; Auth/Data API sintéticos em loopback `127.0.0.1:3104`. Next otimizado em `127.0.0.1:3103`, Chromium headless. O servidor sintético recusa métodos diferentes de GET; harness também detecta qualquer tentativa de acesso a host Supabase. Cookies de teste existem somente no harness externo, sem bypass dentro da aplicação ou alteração da autenticação real.

## Testes de domínio

`tests/academy.test.ts`: **28 casos aprovados**, incluindo:

- Isolamento de organização, aprendiz/equipe/gestão e público PJ;
- Ausência de financeiro, evidências e corpos de aulas de terceiros na projeção da liderança;
- Não ampliação de público restrito durante projeção de autoria;
- Autoria da liderança, aprovação RH/Diretoria e rejeição de escrita por profissional;
- Rascunho versus publicação anterior, snapshots de inscrição, duplicação e arquivamento;
- URLs/credenciais, mídia vazia e requisitos de publicação;
- Limite, duplicidade, liberação histórica e validade de licenças;
- Questionários, tentativas, critérios configurados e documento opcional;
- Atividade prática/evidência, aprovação sem autoaprovação, preservação de complementações e pareceres;
- Recomendações somente para CLT/Estágio da equipe;
- Trilhas publicadas/editadas, adesão com snapshot e PJ opcional;
- Sessões por versão, registro idempotente, encerramento após término, presença e gravação no mesmo conteúdo;
- Referências canônicas nos quatro módulos, restrições por perfil/vínculo e ausência de cópia de conteúdo.

## Navegador

`RUN_BUILT_APP=1 node tests/browser/academy.mjs`: aprovado.

Fluxos exercitados: player reproduzindo vídeo local e legenda; questionário incorreto/correto e bloqueio/conclusão; galeria e download SVG; evidência PDF e persistência após recarga; filtros do catálogo; mapa de trilha; inscrição no treinamento futuro; editor de conteúdo com arquivo, rascunho, publicação, duplicação, segunda edição e arquivamento; capacidade de licenças; revisão de evidência RH; presença e encerramento de sessão passada; gravação no mesmo ID e publicação manual; referências para Onboarding, PDI, cargo e Avaliação; perfis de liderança/profissional/PJ/estágio/Diretoria; celular 390 px, teclado, Escape e preferência de movimento reduzido.

Capturas locais em `work/academy-review/`: início, catálogo, player, trilhas, agenda, conquistas, documento, gestão e celular. Inspeção visual confirmou identidade, conteúdo e ausência de overflow horizontal nas telas capturadas.

O harness não encontrou escritas na API nem erros JavaScript nas jornadas executadas. Proteção remota da Preview é verificada separadamente por metadados/resposta sem autenticação, sem contornar login.

## Checks e regressões

- TypeScript: aprovado.
- ESLint sem warnings: aprovado.
- Suíte Vitest: **223 testes aprovados / 19 arquivos** nesta revisão.
- Build Next otimizado: aprovado com credenciais fictícias e endpoint loopback.
- Regressões em navegador: **6 suítes aprovadas**, todas com zero escritas na API sintética:
  - Pessoas, navegação e documentos: 1.491 consultas;
  - Carreira/PDI: 513 consultas;
  - Avaliação/Hall: 804 consultas;
  - Home Office: 294 consultas;
  - Onboarding: 187 consultas;
  - Offboarding: 249 consultas.

Os quatro widgets de referência também foram abertos nos destinos reais da interface (Onboarding, PDI, cargo e Avaliação), preservando o contexto salvo e o link para o catálogo.

## Limites da verificação

As simulações não comprovam uma política RLS remota ou emissão oficial; nenhuma delas foi implementada ou alterada. Arquivos e estados são locais. Não houve uso de dados pessoais reais, testes de escrita no Supabase, acesso ao portal operacional, merge ou produção. Não foram geradas imagens por IA. Acesso real ao candidato protegido deve ser validado pelo usuário com seu login existente antes de aprovar a mudança do alias.
