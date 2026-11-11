# Proposta — homologação isolada da YouCon People

**Somente proposta. Nenhum projeto, conta de teste, migração remota ou recurso pago foi criado por este documento.**

## Objetivo e separação

Criar um projeto Supabase independente do projeto compartilhado ativo. Usar dados exclusivamente fictícios e permitir validar futuras escritas, RLS, aprovações e históricos sem afetar outros aplicativos. A Preview Vercel atual aponta para o banco ativo; não deve receber fixtures nem ensaios de escrita.

Preferir projeto Supabase separado a clonagem/branch do banco ativo para evitar copiar schemas, dados, usuários e gatilhos de terceiros. Região e plano precisam ser escolhidos pela pessoa, com limite de custo e responsáveis. Manter PostgreSQL 17 compatível com a fundação.

## Configuração proposta

| Área | Configuração | Aprovação necessária |
| --- | --- | --- |
| Infraestrutura | Projeto Supabase novo; organização, nome, região, plano/custo e acesso administrativo mínimos | Autorizar criação e eventual cobrança; confirmar os destinos |
| Banco | Aplicar somente a migração People versionada em banco novo/vazio, após conferir project ref | Autorizar escrita exclusivamente em homologação; nunca reaplicar no ativo |
| Data API | Expor youcon_people; manter youcon_people_private fora da API; preservar RLS/grants | Autorizar configuração somente do novo projeto |
| Auth | Login por senha; sem cadastro público na aplicação. Configurar política de teste no novo projeto, sem herdar gatilhos de terceiros | Autorizar configuração do Auth isolado |
| Fixtures | Organizações, unidades futuras e identidades fictícias; Profissional/Liderança/RH/Diretoria e CLT/estágio/PJ, inativos e sem vínculo | Autorizar contas sintéticas e fixtures somente no projeto de homologação |
| Vercel | Duas variáveis públicas com URL e publishable key do novo projeto, apenas Preview e preferencialmente branch de homologação explicitamente escolhida | Autorizar troca do destino das novas Previews e eventual redeploy Preview; produção intocada |
| Segredos | Credenciais administrativas somente em ferramenta/segredo restrito; nunca NEXT_PUBLIC, Git, logs ou arquivos de entrega | Pessoa fornece por configuração segura, nunca no chat |
| Rede | Permitir novo hostname Supabase no ambiente de desenvolvimento | Autorizar alteração da configuração de rede, se necessária |
| Operação | Responsável, política de retenção/limpeza, recuperação e descarte do ambiente de teste | Aprovar custo, retenção e operações destrutivas separadamente |

A alteração de variáveis afeta novas implantações; Previews antigas conservam o build/configuração anterior e devem ser identificadas claramente. Não remover proteção Vercel nem criar links públicos permanentes. Não mudar variáveis de Production, domínio, branch de produção ou configurações globais do Supabase ativo.

## Critérios de aceite antes de novas escritas funcionais

1. Conferir os project refs e provar que homologação difere do ativo; nenhum dump/usuário/dado real importado.
2. Confirmar migração, grants, RLS, schema privado e ausência de privilégios anônimos.
3. Testar login, expiração/renovação, logout local e ausência de efeitos em outras sessões.
4. Exercitar todos os papéis e contratos, vínculos inativos, usuário sem vínculo, duas organizações e tentativas diretas de acesso indevido.
5. Confirmar que a Preview aprovada aponta ao novo projeto e que produção permanece inalterada.
6. Antes de cada nova migração funcional, revisar diff e testes locais; pedir autorização específica de aplicação no destino confirmado.

## Modelagem seguinte, ainda não implementada

Separar pessoa de conta Auth e vínculo de acesso; pessoa pode existir sem login. Distinguir organização de unidade e preservar vínculos/movimentações com vigência. Definir capacidades explícitas; central e dashboards só RH/Diretoria, solicitações de usuário sempre com aprovação RH. PJ exige elegibilidade própria, sem processos indevidos de empregados. Fechamento mensal validado pelo RH deve preservar histórico oficial.

Ponto/férias/ausências permanecem no Flash; avaliação técnica externa; eventos em Comunicação/Calendário. Finanças, planejamento de contratações e equipamentos detalhados continuam adiados. Nenhuma implementação dessas regras autorizada por esta proposta.
