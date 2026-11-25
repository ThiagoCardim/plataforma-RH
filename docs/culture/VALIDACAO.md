# Validação da Cultura

## Ambiente e checks

Next.js otimizado com URL e chave pública fictícias em loopback (`127.0.0.1:3104`), Chromium headless em `127.0.0.1:3103`. API sintética recusa métodos diferentes de GET. Harness identifica qualquer requisição a host Supabase remoto. Cookies de teste ficam exclusivamente no harness externo, sem alterar a autenticação do produto.

- TypeScript / Next typegen: aprovado.
- ESLint sem warnings: aprovado.
- Vitest: **243 testes em 20 arquivos aprovados**.
- Build otimizado Next: aprovado.
- `git diff --check`: aprovado.

## Domínio — 22 casos

`tests/culture.test.ts`: nomes/grupos confirmados, ausência de fatos institucionais inventados, permissões RH/Diretoria, negação a profissional/liderança, projeção sem rascunhos/histórico privado, visibilidade PJ, exclusão de compromissos/rituais, ordem/ocultação de seções, organização, metas/avanço, arquivos/URLs/PDF, publicação de manual, ciência CLT/Estágio, versão ausente/obsoleta/PJ, idempotência Cultura/Onboarding, preservação de ciências anteriores, independência de versão visual versus manual, identidade de arquivos após recarga, substituição de PDF/link, recuperação histórica e projeção pública de Destaque Cultural sem alterar o Hall.

## Navegador

`RUN_BUILT_APP=1 node tests/browser/culture.mjs`: **PASS**, 477 consultas sintéticas e zero escritas na API.

Fluxos:

- Landing, grupos de valores, expansões e cartas, manual inicial indisponível sem exigência de ciência;
- Rascunho privado, persistência após recarga e publicação explícita;
- Editor compartilhado, texto, PDF, vídeo e legenda VTT; reordenação de blocos, seções e ocultação;
- Prévia editorial sem publicar;
- Player local reproduzindo vídeo e arquivo persistido após recarga;
- Leitura por capítulos, visualização PDF e download;
- Ciência no Cultura visível no próprio Onboarding sem duplicidade;
- Nova versão do manual, ciência pelo Onboarding visível no Cultura, histórico original preservado;
- Recuperação histórica como rascunho sem alterar a publicação vigente;
- Isolamento entre organizações no navegador;
- PJ, liderança PJ, gestor RH PJ, CLT, estágio, liderança e Diretoria;
- Ausência de gravação nas chaves do Hall durante navegação/curadoria da Cultura;
- Mobile 390 px sem overflow horizontal, teclado, Escape e movimento reduzido.

Capturas locais em `work/culture-review/`: landing, valores, carta com mídia de teste, manual, curadoria e celular. Inspeção visual realizada; fotografias permanecem como espaços personalizáveis, sem geração de imagens.

## Regressões

Cinco suítes dos módulos afetados: **PASS**, todas com zero escritas na API sintética.

| Suíte                           | Consultas sintéticas | Resultado |
| ------------------------------- | -------------------: | --------- |
| Pessoas, documentos e navegação |                1.481 | PASS      |
| Onboarding                      |                  193 | PASS      |
| Offboarding                     |                  261 | PASS      |
| Academy                         |                  475 | PASS      |
| Avaliação e Hall                |                  823 | PASS      |

Os testes de domínio dos demais módulos integram os 243 casos aprovados acima. O editor original de documentos manteve criação, filtros, arquivos, publicação, versões, duplicação, arquivamento e leitura. A regressão da Academy confirmou também as referências já existentes para PDI/Carreira/Onboarding/Avaliação.

## Limites

Não equivale a auditoria WCAG completa, certificação de ciência, validação jurídica ou prova de integridade do armazenamento local. Testes remotos autenticados não usam bypass; estado/proteção da Preview são conferidos separadamente por metadados. O manual oficial continua pendente de disponibilização, portanto o conteúdo institucional específico não foi homologado ou inventado. Nenhuma escrita no Supabase, migration, alteração de Auth/RLS, merge ou produção foi executada.

O PDF demonstrativo foi inspecionado com `pdfinfo`: uma página A4, PDF 1.4, sem JavaScript ou criptografia. A visualização depende do leitor PDF nativo do navegador; o download permanece disponível.
