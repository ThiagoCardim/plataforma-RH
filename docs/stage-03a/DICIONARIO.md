# Dicionário proposto — Etapa 03A

Documento complementar a [PLANEJAMENTO.md](PLANEJAMENTO.md). Todos os campos são propostas para revisão; não foram criados objetos. Nomes físicos finais e limites serão fechados na 03B. Cada linha representa um campo; coleções são entidades separadas, não listas livres dentro da pessoa.

## Convenções aplicáveis a todas as linhas

- Obrigação: S = obrigatório ao confirmar; N = opcional; C = condicional explicado na finalidade. Rascunho pode estar incompleto, mas não pode ativar contrato sem validação.
- Leitura: R = RH na organização autorizada; D = Diretoria na projeção gerencial; T = próprio titular no futuro Meu Espaço, se houver associação validada e acesso vigente; O = operador técnico autorizado. Nenhum papel recebe acesso entre organizações. Liderança só tem T para seus dados nesta base.
- Edição: R = RH, com motivo e auditoria; O = operador em processo separado; S = sistema futuro derivado/gerado, sem edição livre. “Solicitar” nunca equivale a editar o oficial.
- Aprovação: P = proposta do titular exige aprovação de outro RH antes de aplicar; A = operação administrativa RH direta auditada, sem segunda aprovação por padrão; V = validação operacional separada; — = campo automático/imutável. Se RH atuar nos seus próprios dados via solicitação, exige outro RH. P não significa que o profissional possa propor qualquer campo: somente os marcados P ficam inicialmente disponíveis.
- Histórico: S = guardar versões/eventos proporcionais à finalidade e retenção; I = imutável, auditar criação; D = derivado de fontes com histórico. Não implica retenção eterna ou cópia irrestrita dos valores em logs.
- Proteção: B = dado organizacional básico, ainda sujeito a escopo; P = pessoal comum com acesso mínimo; E = proteção elevada, segregar e mascarar quando aplicável; L = sensível legal, não coletar nesta etapa. B não significa público.

## A. Identificação e conta

| Campo | Finalidade | Tipo | Obrig. | Leitura | Edição | Aprovação | Histórico | Proteção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| persons.id | Chave estável sem significado pessoal | UUID | S | R,D,T | S | — | I | P |
| persons.organization_id | Isolar a ficha; não transferir ficha por edição | UUID/FK existente | S | R,D,T | S | — | I | B |
| persons.internal_code | Referência interna única por organização; não usar CPF | texto até 40 | S | R,D,T | S | — | I | P |
| persons.full_name | Identificação civil cadastral | texto até 160 | S | R,D,T | R | P | S | P |
| persons.display_name | Nome de apresentação preferido, sem inferir identidade sensível | texto até 160 | N | R,D,T | R | P | S | P |
| persons.cpf | Identificação fiscal quando necessária ao contrato; não chave primária | texto normalizado de 11 dígitos | C: exigência validada | R,T | R | P | S, versão protegida | E |
| persons.birth_date | Identificação/validação contratual; evitar coleta sem finalidade | date | C: obrigação justificada | R,T | R | P | S | E |
| persons.version | Detectar alteração concorrente | bigint | S | R,S | S | — | S | B |
| profiles.user_id | Identidade de conta existente; não nova pessoa | UUID Auth, sem FK compartilhada | C: conta | O,T | O | V | I | E |
| profiles.display_name | Apresentação mínima existente, distinta do nome oficial | texto existente | N | T, conforme RLS atual | O nesta fase | V | S futuro | P |
| person_accounts.id | Identificar associação | UUID | C: associação | R,O | S | — | I | P |
| person_accounts.organization_id | Escopo da associação | UUID/FK | S | R,O | S | — | I | B |
| person_accounts.person_id | Ficha associada | UUID/FK composta | S | R,O | O | V | S | P |
| person_accounts.user_id | Conta validada; unique vigente por organização | UUID/referência profiles | S | O,T; R vê status mínimo | O | V | S | E |
| person_accounts.valid_from | Início da associação validada | timestamptz | S | R,O,T | O | V | S | P |
| person_accounts.valid_to | Encerrar associação sem apagar histórico | timestamptz | N | R,O,T | O | V | S | P |
| access_status | Mostrar sem conta/associada/sem acesso People | derivado | S | R,D,T, projeção mínima | S | — | D | P |

Não coletar RG, nacionalidade, estado civil ou gênero por padrão. Nome de apresentação não deve exigir declaração de gênero. CPF, quando presente, valida dígitos e formato no servidor; não é prova isolada de identidade. Duplicidade gera revisão, sem revelar dados de outra organização. Não há sincronização automática entre nome cadastral e profile nesta proposta.

## B. Contato

| Campo | Finalidade | Tipo | Obrig. | Leitura | Edição | Aprovação | Histórico | Proteção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| person_contacts.id | Identificar contato | UUID | S | R,T | S | — | I | P |
| person_contacts.organization_id | Isolamento | UUID/FK | S | R,T | S | — | I | B |
| person_contacts.person_id | Titular do contato | UUID/FK composta | S | R,T | S | — | I | P |
| person_contacts.kind | E-mail/telefone | enum | S | R,T | R | P | S | P |
| person_contacts.scope | Profissional ou pessoal | enum | S | R,T; D só profissional | R | P | S | P |
| person_contacts.value | Contato para finalidade declarada | texto validado | S por contato; coleção N | R,T; D só profissional | R | P | S, mínimo protegido | E se pessoal; P profissional |
| person_contacts.is_primary | Escolher contato prioritário por tipo/finalidade | boolean | S | R,T | R | P | S | P |
| person_addresses.id | Identificar endereço, no máximo um vigente por finalidade inicial | UUID | C: endereço necessário | R,T | S | — | I | E |
| person_addresses.organization_id | Isolamento | UUID/FK | S | R,T | S | — | I | B |
| person_addresses.person_id | Titular | UUID/FK composta | S | R,T | S | — | I | E |
| person_addresses.postal_code | Correspondência/obrigação contratual | texto | C: endereço brasileiro | R,T | R | P | S | E |
| person_addresses.street | Logradouro | texto até 160 | C: endereço coletado | R,T | R | P | S | E |
| person_addresses.number | Número ou indicação sem número | texto até 20 | C: endereço coletado | R,T | R | P | S | E |
| person_addresses.complement | Complemento necessário | texto até 80 | N | R,T | R | P | S | E |
| person_addresses.district | Bairro | texto até 80 | N | R,T | R | P | S | E |
| person_addresses.city | Município | texto até 100 | C: endereço coletado | R,T | R | P | S | E |
| person_addresses.state | UF/região | texto até 80 | C: conforme país | R,T | R | P | S | E |
| person_addresses.country | Interpretar formato/endereço | código de país | C: endereço coletado | R,T | R | P | S | E |

E-mail de contato não é o e-mail de login nem altera Supabase Auth. Não exigir e-mail ou telefone para cadastrar pessoa sem conta, salvo finalidade aprovada. Não expor contato pessoal à Diretoria por padrão. Contato de emergência e documentos de endereço ficam adiados.

## C. Vínculo e estrutura profissional

| Campo | Finalidade | Tipo | Obrig. | Leitura | Edição | Aprovação | Histórico | Proteção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| engagements.id | Identificar cada relação profissional | UUID | S | R,D,T | S | — | I | P |
| engagements.organization_id | Organização contratante | UUID/FK | S | R,D,T | S | — | I | B |
| engagements.person_id | Pessoa vinculada | UUID/FK composta | S | R,D,T | S | — | I | P |
| engagements.contract_type | Distinguir clt/intern/pj | enum | S | R,D,T | R só rascunho | A | I após ativação | P |
| engagements.start_date | Início contratual | date | S na ativação | R,D,T | R | A | S | P |
| engagements.planned_end_date | Prazo previsto, distinto do encerramento real | date | C: prazo determinado/estágio/PJ conforme contrato | R,D,T | R | A | S | P |
| engagements.end_date | Encerramento real inclusive | date | C: encerrado | R,D,T | R | A | S | P |
| engagements.end_reason_code | Motivo categorizado, sem narrativas excessivas | catálogo | C: encerrado/cancelado | R; D recorte gerencial; T conforme política | R | A | S | E |
| engagements.lifecycle_state | Rascunho/confirmado/cancelado; status temporal derivado | enum | S | R,D,T | R via transição | A | S | P |
| engagement_status | Programado/vigente/encerrado na data de referência | derivado de estado e datas | S | R,D,T | S | — | D | P |
| engagements.is_primary | Resumo quando houver simultaneidade, se aprovado | boolean efetivo/versionado | C: regra D04 | R,D,T | R | A | S | P |
| engagements.version | Concorrência | bigint | S | R,S | S | — | S | B |
| engagement_assignments.id | Identificar versão de alocação | UUID | S | R,D,T | S | — | I | P |
| engagement_assignments.organization_id | Isolamento | UUID/FK | S | R,D,T | S | — | I | B |
| engagement_assignments.engagement_id | Vínculo afetado | UUID/FK composta | S | R,D,T | S | — | I | P |
| engagement_assignments.unit_id | Unidade operacional | UUID/FK composta | C: ativação conforme política | R,D,T | R via nova versão | A | S | P |
| engagement_assignments.department_id | Área/setor | UUID/FK composta | C: ativação conforme política | R,D,T | R via nova versão | A | S | P |
| engagement_assignments.position_id | Cargo CLT/estágio ou função contratual PJ | UUID/FK composta | C: ativação conforme política | R,D,T | R via nova versão | A | S | P |
| engagement_assignments.leader_engagement_id | Responsável vigente; PJ com semântica contratual | UUID/FK composta, nullable | N, ausência explícita | R,D,T | R via nova versão | A | S | P |
| engagement_assignments.valid_from | Início da vigência da alocação | date | S | R,D,T | R | A | S | P |
| engagement_assignments.valid_to | Fim exclusivo, sem sobreposição | date | N: versão aberta | R,D,T | R | A | S | P |
| engagement_assignments.reason | Justificar movimentação/correção | texto limitado, sem dados de saúde | S para mudança | R; D/T recorte permitido | R | A | S | E |

Os campos abaixo aplicam-se individualmente a cada catálogo units, departments e positions. Não são uma tabela única obrigatória.

| Campo de catálogo | Finalidade | Tipo | Obrig. | Leitura | Edição | Aprovação | Histórico | Proteção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| id | Chave da unidade/setor/cargo | UUID | S | R,D; T quando referenciado | S | — | I | B |
| organization_id | Escopo | UUID/FK | S | R,D | S | — | I | B |
| code | Identificação estável única na organização | texto até 40 | S | R,D | R | A | I | B |
| name | Rótulo para seleção e histórico | texto até 160 | S | R,D,T quando referenciado | R | A | S | B |
| active | Impedir novos usos sem apagar passado | boolean | S | R,D | R | A | S | B |

Organização reutiliza id/name/slug existentes. Não coletar endereço residencial para representar unidade. Hierarquia de setores e equipes poderá ser desenhada depois; não adicionar dependências recursivas desnecessárias agora.

## D. Particularidades contratuais

Cada extensão deve ter engagement_id como chave e organization_id para consistência. Campos monetários não são parte do mínimo aprovado: sua inclusão depende de finalidade e segregação específicas. Contrato PDF, pagamento e folha não serão armazenados nesta etapa.

| Campo | Finalidade | Tipo | Obrig. | Leitura | Edição | Aprovação | Histórico | Proteção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| engagement_clt.engagement_id | Detalhe exclusivo de vínculo CLT | UUID/FK composta | C: CLT | R,T | S | — | I | P |
| engagement_clt.organization_id | Escopo | UUID/FK | S | R,T | S | — | I | B |
| engagement_clt.registration_code | Matrícula empregatícia se distinta do código da pessoa | texto até 40 | N | R,T | R | A | S | E |
| engagement_clt.term_type | Prazo determinado/indeterminado | enum | C: CLT confirmado | R,T; D resumo se necessário | R | A | S | P |
| engagement_clt.weekly_hours | Carga contratual, sem controle de ponto | numeric com limites validados | C: exigência contratual | R,T | R | A | S | E |
| engagement_intern.engagement_id | Detalhe exclusivo de estágio | UUID/FK composta | C: estágio | R,T | S | — | I | P |
| engagement_intern.organization_id | Escopo | UUID/FK | S | R,T | S | — | I | B |
| engagement_intern.educational_institution | Instituição para termo de estágio | texto até 160 | C: estágio confirmado | R,T | R | A | S | P |
| engagement_intern.course | Curso necessário ao termo | texto até 160 | C: estágio confirmado | R,T | R | A | S | P |
| engagement_intern.agreement_reference | Identificador do termo, sem arquivo | texto até 80 | C: estágio confirmado | R,T | R | A | S | E |
| engagement_intern.weekly_hours | Carga pactuada, não ponto | numeric com limites legais validados | C: estágio confirmado | R,T | R | A | S | E |
| engagement_intern.supervisor_engagement_id | Supervisão de estágio; validar organização e vigência | UUID/FK composta | C: estágio confirmado | R,T; D resumo | R | A | S | P |
| service_providers.id | Identificar fornecedor PJ local | UUID | C: PJ | R | S | — | I | B |
| service_providers.organization_id | Escopo do fornecedor | UUID/FK | S | R | S | — | I | B |
| service_providers.cnpj | Identificação fiscal do contratado, inclusive MEI | texto de 14 caracteres normalizados | C: PJ nacional | R; T seu contrato | R | A | S | E |
| service_providers.legal_name | Razão social contratada | texto até 200 | C: PJ | R,D; T seu contrato | R | A | S | E se identifica pessoa natural |
| engagement_pj.engagement_id | Atuação da pessoa no contrato de prestação | UUID/FK composta | C: PJ | R,D,T | S | — | I | P |
| engagement_pj.organization_id | Escopo | UUID/FK | S | R,D,T | S | — | I | B |
| engagement_pj.service_provider_id | Empresa contratada | UUID/FK composta | C: PJ confirmado | R,D,T recorte contratual | R | A | S | E |
| engagement_pj.contract_reference | Identificação administrativa do contrato | texto até 80 | C: PJ confirmado | R,T | R | A | S | E |
| engagement_pj.service_scope | Escopo profissional resumido, sem avaliação | texto limitado | C: PJ confirmado | R,D,T | R | A | S | P |

CNPJ não deve ser tipado como número nem limitado a uma expressão exclusivamente numérica: validar os formatos vigentes na implementação e a compatibilidade com CNPJ alfanumérico. Prestador estrangeiro, múltiplas pessoas no mesmo contrato PJ e aditivos exigem decisão específica: o modelo inicial referencia fornecedor e vínculo da pessoa; um catálogo de contratos compartilhados pode ser necessário depois, sem presumir contrato único por empresa. Salário, bolsa e valor de prestação ficam adiados; caso aprovados futuramente, valores decimais, moeda e vigência em estrutura segregada, sem conceder à Diretoria acesso individual automático.

## E. Histórico, solicitações e auditoria

| Campo | Finalidade | Tipo | Obrig. | Leitura | Edição | Aprovação | Histórico | Proteção |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| change_requests.id | Acompanhar pedido | UUID | S | R,T solicitante | S | — | I | P |
| change_requests.organization_id | Escopo autorizado | UUID/FK | S | R,T | S | — | I | B |
| change_requests.person_id | Pessoa objeto | UUID/FK composta | S | R,T | S | — | I | P |
| change_requests.requester_user_id | Autoria validada no servidor | UUID | S | R,T | S | — | I | E |
| change_requests.base_version | Versão cadastral lida na submissão | bigint | S | R,T | S | — | I | B |
| change_requests.status | Rascunho/pendente/aprovado/rejeitado/cancelado/conflito | enum | S | R,T | S via fluxo | — | S | P |
| change_requests.submitted_at | Momento do envio | timestamptz | C: enviado | R,T | S | — | I | P |
| change_requests.reviewed_by | RH responsável; impedir autoaprovação | UUID | C: decidido | R,T com identificação mínima | S | — | I | E |
| change_requests.reviewed_at | Instante da decisão | timestamptz | C: decidido | R,T | S | — | I | P |
| change_requests.decision_reason | Motivo claro; obrigatório na rejeição | texto limitado | C: rejeição/conflito | R,T | R ao decidir | A | I após decisão | E |
| change_request_items.id | Identificar item do pedido | UUID | S | R,T | S | — | I | P |
| change_request_items.organization_id | Escopo herdado validado | UUID/FK | S | R,T | S | — | I | B |
| change_request_items.request_id | Pedido associado | UUID/FK composta | S | R,T | S | — | I | P |
| change_request_items.field_code | Campo de lista permitida, nunca caminho arbitrário | enum/catálogo | S | R,T | T em rascunho | P | I após envio | P |
| change_request_items.proposed_value | Proposta tipada/validada conforme campo | JSON tipado por lista permitida | S | R,T | T em rascunho | P | I após envio | Herda classificação do campo |
| audit_events.id | Identificar evento | UUID | S | O; R recorte | S | — | I | B |
| audit_events.organization_id | Isolar auditoria | UUID/FK | S | O; R recorte | S | — | I | B |
| audit_events.actor_user_id | Quem executou, sem depender de conta persistir | UUID | C: ação humana | O; R recorte | S | — | I | E |
| audit_events.actor_capability | Capacidade validada ao executar | texto de catálogo | S | O; R recorte | S | — | I | B |
| audit_events.entity_type | Tipo da entidade afetada | enum | S | O; R recorte | S | — | I | B |
| audit_events.entity_id | Referência estável do objeto | UUID | S | O; R recorte | S | — | I | P |
| audit_events.action | Criação/correção/movimentação/decisão/exportação etc. | enum | S | O; R recorte | S | — | I | B |
| audit_events.recorded_at | Tempo do registro UTC | timestamptz | S | O; R recorte | S | — | I | P |
| audit_events.effective_date | Data de efeito de negócio | date | C: mudança efetiva | O; R recorte | S | — | I | P |
| audit_events.change_summary | Diferença mínima ou referência a versão protegida | JSON de lista permitida | S | O; R recorte | S | — | I | Herda maior proteção do campo |
| audit_events.reason | Motivo administrativo | texto limitado | C: alteração/decisão | O; R recorte | S captura motivo RH | A | I | E |
| audit_events.request_id | Rastrear origem em pedido | UUID/FK composta | C: originado em pedido | O; R recorte | S | — | I | P |
| audit_events.correlation_id | Relacionar transação/idempotência | UUID | S | O | S | — | I | B |

Entidades novas terão created_at (timestamptz, obrigatório, sistema, imutável, leitura conforme entidade, proteção P quando ligado a pessoa) e created_by (UUID do ator quando humano, sistema, imutável, leitura R/O, proteção E). Versões de alocação e retificações terão referência supersedes_id (UUID da versão anterior na mesma organização, condicional, sistema, imutável, R e projeção D/T autorizada, proteção herdada). Esses campos não autorizam mostrar a trilha técnica completa à Diretoria ou ao titular.

Não armazenar valor anterior duplicado em todo pedido por padrão: base_version referencia a versão protegida; comparação no servidor valida conflito. Valores rejeitados também têm retenção limitada. Reingresso é novo engagement, não um campo sobrescrito em persons. Mudanças de cargo, setor, unidade e liderança são versões de engagement_assignments. Alteração de tipo é novo vínculo. Encerramento preserva a relação anterior e a autoria do evento.
