import {
  type Scope,
  type Contract,
  assert,
  uid,
  dateNow,
} from "../career/model";
import { type Attachment } from "../documents/model";
export const views = [
  ["visao-geral", "Visão Geral"],
  ["vagas", "Gestão de Vagas"],
  ["talentos", "Banco de Talentos"],
  ["match", "YouCon Match"],
  ["modelos", "Modelos e Avaliações"],
  ["carreiras", "Página de Carreiras"],
] as const;
export type View = (typeof views)[number][0];
export const allowedView = (c: Scope, v: View) =>
  c.rh || ((c.director || c.leader) && ["visao-geral", "vagas"].includes(v));
export type Field = {
  id: string;
  label: string;
  type:
    | "Texto"
    | "Parágrafo"
    | "E-mail"
    | "Telefone"
    | "Número"
    | "Data"
    | "Seleção"
    | "Múltipla escolha"
    | "Arquivo"
    | "Confirmação";
  required: boolean;
  options: string[];
  mapping: string;
  condition?: { field: string; equals: string };
};
export type Form = {
  id: string;
  name: string;
  fields: Field[];
  message: string;
  color: string;
  version: number;
};
export type Stage = {
  id: string;
  name: string;
  days: number;
  fields: Field[];
  tasks: { id: string; title: string; required: boolean }[];
};
export const factFields = [
  "Competências",
  "Softwares",
  "Formação",
  "Experiência",
  "Disponibilidade",
  "Modalidade",
] as const;
export type FactField = (typeof factFields)[number];
export type Criterion = {
  id: string;
  field: FactField;
  expected: string;
  mandatory: boolean;
  weight: number;
};
export type Job = {
  id: string;
  title: string;
  sector: string;
  contract: Contract;
  positions: number;
  description: string;
  activities: string;
  requirements: string;
  benefits: string;
  budget?: number;
  cost?: number;
  forecast: string;
  owner: string;
  state: "Prevista" | "Rascunho" | "Publicada" | "Pausada" | "Encerrada";
  visibility: "Listada" | "Link exclusivo";
  token?: string;
  form: Form;
  stages: Stage[];
  criteria: Criterion[];
  revision: number;
  created: string;
  closed?: string;
};
export type Claim = {
  id: string;
  field: FactField;
  value: string;
  status: "Documentado" | "Não atende";
  source: string;
};
export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  sector: string;
  education: string;
  experience: string;
  skills: string;
  software: string;
  availability: string;
  expected: number;
  contracts: Contract[];
  source: string;
  referral: string;
  tags: string[];
  created: string;
  retentionUntil: string;
  consent: string;
  cv?: Attachment;
  portfolio?: Attachment;
  summary: string;
  claims: Claim[];
  erased?: boolean;
};
export type Event = { id: string; at: string; by: string; text: string };
export type Application = {
  id: string;
  candidate: string;
  job: string;
  stage: string;
  stages: Stage[];
  jobTitle: string;
  contract: Contract;
  sector: string;
  entered: string;
  visits: { stage: string; at: string }[];
  created: string;
  assigned: string[];
  shareCV: boolean;
  shareAnswers: boolean;
  fields: Record<string, string>;
  checks: Record<string, boolean>;
  answers: Record<string, string>;
  answerFiles: Record<string, Attachment>;
  form: Form;
  status: "Ativa" | "Encerrada" | "Contratada";
  decision?: "Aprovado RH" | "Não selecionado";
  reason?: string;
  events: Event[];
  hiredAt?: string;
};
export type Note = {
  id: string;
  application: string;
  kind: "Confidencial RH" | "Entrevista" | "Técnica" | "Teste prático";
  text: string;
  shared: boolean;
  by: string;
  at: string;
};
export type Interview = {
  id: string;
  application: string;
  title: string;
  date: string;
  time: string;
  responsible: string;
  note: string;
  state: "Agendada" | "Realizada" | "Cancelada";
};
export type Template = {
  id: string;
  name: string;
  kind:
    | "Processo"
    | "DISC"
    | "Temperamentos"
    | "Entrevista"
    | "Avaliação técnica"
    | "Teste prático"
    | "Proposta"
    | "Mensagem"
    | "Motivo de encerramento";
  body: string;
  questions: string[];
  stages?: Stage[];
  version: number;
};
export type Assessment = {
  id: string;
  candidate: string;
  template: Template;
  token: string;
  answers: Record<string, string>;
  created: string;
  completedAt?: string;
};
export type Offer = {
  id: string;
  application: string;
  amount: number;
  body: string;
  state: "Preparação" | "Enviada (simulação)" | "Aceita" | "Recusada";
  template?: Template;
  events: Event[];
};
export type Exception = {
  id: string;
  application: string;
  amount: number;
  reason: string;
  by: string;
  state: "Pendente" | "Aprovada" | "Recusada";
  reviewedBy?: string;
  comment?: string;
  at: string;
};
export const triggers = [
  "Nova candidatura",
  "Mudança de etapa",
  "Entrevista agendada",
  "Avaliação pendente",
  "Aprovação RH",
  "Proposta aceita",
] as const;
export const actions = [
  "Criar card",
  "Gerar checklist",
  "Registrar no calendário local",
  "Gerar notificação local",
  "Preparar proposta",
  "Preparar admissão",
] as const;
export type Rule = {
  id: string;
  name: string;
  trigger: (typeof triggers)[number];
  action: (typeof actions)[number];
  sector: string;
  contract: string;
  active: boolean;
};
export type AutoLog = {
  id: string;
  rule: string;
  cause: string;
  application: string;
  action: string;
  at: string;
};
export type TalentFilter = {
  search: string;
  sector: string;
  education: string;
  experience: string;
  skills: string;
  software: string;
  city: string;
  availability: string;
  salary: string;
  contract: string;
  source: string;
  from: string;
  until: string;
  job: string;
  compatibility: string;
};
export const emptyFilters = (): TalentFilter => ({
  search: "",
  sector: "",
  education: "",
  experience: "",
  skills: "",
  software: "",
  city: "",
  availability: "",
  salary: "",
  contract: "",
  source: "",
  from: "",
  until: "",
  job: "",
  compatibility: "",
});
export type Handoff = {
  id: string;
  candidate: string;
  application: string;
  org: string;
  by: string;
  at: string;
  fields: Record<string, string>;
  destinations: string[];
  state: "Preparada" | "Onboarding local criado";
};
export type State = {
  version: 1;
  org: string;
  jobs: Job[];
  candidates: Candidate[];
  applications: Application[];
  notes: Note[];
  interviews: Interview[];
  forms: Form[];
  templates: Template[];
  assessments: Assessment[];
  offers: Offer[];
  exceptions: Exception[];
  rules: Rule[];
  logs: AutoLog[];
  filters: { id: string; name: string; value: TalentFilter }[];
  handoffs: Handoff[];
  privacy: { purpose: string; days: number; version: number };
  career: { title: string; intro: string; culture: string; color: string };
  analyses: {
    id: string;
    candidate: string;
    job: string;
    jobRevision: number;
    at: string;
    result: MatchResult;
  }[];
  events: Event[];
};
export const ev = (c: Scope, text: string): Event => ({
  id: uid(),
  by: c.name,
  at: new Date().toISOString(),
  text,
});
export function guard(
  s: State,
  c: Scope,
  kind: "view" | "hr" | "director" = "view",
) {
  assert(s.org === c.org, "Organização não autorizada.");
  assert(
    kind === "hr"
      ? c.rh
      : kind === "director"
        ? c.director
        : c.rh || c.director || c.leader,
    "Ação fora das atribuições autenticadas.",
  );
}
export const assigned = (a: Application, c: Scope) =>
  c.leader && a.assigned.includes(c.user);
export function projection(s: State, c: Scope): State {
  guard(s, c);
  if (c.rh) return s;
  if (c.director)
    return {
      ...s,
      candidates: s.candidates.map((p, i) => ({
        ...p,
        name: `Candidato ${String(i + 1).padStart(3, "0")}`,
        email: "",
        phone: "",
        city: "",
        education: "",
        experience: "",
        skills: "",
        software: "",
        availability: "",
        expected: 0,
        summary: "",
        claims: [],
        cv: undefined,
        portfolio: undefined,
        tags: [],
        source: p.source,
        referral: "",
        consent: "",
      })),
      jobs: s.jobs.map((j) => ({
        ...j,
        token: undefined,
        stages: j.stages.map((x) => ({ ...x, fields: [], tasks: [] })),
      })),
      applications: s.applications.map((a) => ({
        ...a,
        stages: a.stages.map((x) => ({ ...x, fields: [], tasks: [] })),
        answers: {},
        answerFiles: {},
        fields: {},
        checks: {},
        assigned: [],
        events: [],
        form: { ...a.form, fields: [] },
        reason: undefined,
      })),
      analyses: [],
      notes: [],
      interviews: s.interviews.map((x) => ({ ...x, note: "" })),
      assessments: [],
      forms: [],
      templates: [],
      offers: s.offers.map((x) => ({
        ...x,
        body: "",
        template: undefined,
        events: [],
      })),
      rules: [],
      logs: [],
      filters: [],
      handoffs: [],
      events: [],
    };
  const apps = s.applications.filter((a) => assigned(a, c)),
    ids = new Set(apps.map((a) => a.candidate)),
    jobs = new Set(apps.map((a) => a.job));
  return {
    ...s,
    jobs: s.jobs
      .filter((j) => jobs.has(j.id))
      .map((j) => ({
        ...j,
        stages: j.stages.map((x) => ({ ...x, fields: [], tasks: [] })),
        budget: undefined,
        cost: undefined,
        criteria: [],
        form: { ...j.form, fields: [] },
        token: undefined,
        description: "",
        activities: "",
        requirements: "",
        benefits: "",
      })),
    candidates: s.candidates
      .filter((p) => ids.has(p.id))
      .map((p) => {
        const rows = apps.filter((a) => a.candidate === p.id);
        return {
          ...p,
          email: "",
          phone: "",
          expected: 0,
          claims: [],
          summary: "",
          consent: "",
          source: "",
          referral: "",
          tags: [],
          cv: rows.some((a) => a.shareCV) ? p.cv : undefined,
          portfolio: rows.some((a) => a.shareCV) ? p.portfolio : undefined,
        };
      }),
    applications: apps.map((a) => ({
      ...a,
      fields: {},
      checks: {},
      stages: a.stages.map((x) => ({ ...x, fields: [], tasks: [] })),
      answers: a.shareAnswers ? a.answers : {},
      answerFiles: a.shareAnswers && a.shareCV ? a.answerFiles : {},
      form: a.shareAnswers ? a.form : { ...a.form, fields: [] },
      events: [],
      decision: undefined,
      reason: undefined,
    })),
    analyses: [],
    notes: s.notes.filter(
      (n) =>
        apps.some((a) => a.id === n.application) &&
        n.shared &&
        n.kind !== "Confidencial RH",
    ),
    interviews: s.interviews
      .filter((x) => apps.some((a) => a.id === x.application))
      .map((x) => ({ ...x, note: "" })),
    forms: [],
    templates: [],
    assessments: [],
    offers: [],
    exceptions: [],
    rules: [],
    logs: [],
    filters: [],
    handoffs: [],
    events: [],
    privacy: { ...s.privacy, purpose: "" },
  };
}
const norm = (x: string) =>
  x
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function validateFields(fields: Field[]) {
  assert(
    new Set(fields.map((f) => f.id)).size === fields.length,
    "Campos duplicados.",
  );
  for (const [i, f] of fields.entries()) {
    assert(f.label.trim(), "Nome do campo obrigatório.");
    if (["Seleção", "Múltipla escolha"].includes(f.type))
      assert(
        f.options.length >= 2 && f.options.every((x) => x.trim()),
        "Defina pelo menos duas opções.",
      );
    if (f.condition)
      assert(
        fields.slice(0, i).some((x) => x.id === f.condition!.field),
        "Condições devem apontar para campos anteriores; sem ciclos.",
      );
  }
}
export function visibleFields(form: Form, answers: Record<string, string>) {
  const visible = new Set<string>();
  return form.fields.filter((f) => {
    const yes =
      !f.condition ||
      (visible.has(f.condition.field) &&
        (answers[f.condition.field] ?? "")
          .split("|")
          .includes(f.condition.equals));
    if (yes) visible.add(f.id);
    return yes;
  });
}
export function validFile(f: Attachment) {
  assert(
    f.url.startsWith("blob:") && f.size >= 0 && f.size <= 10 * 1024 * 1024,
    "Use somente arquivo local de até 10 MB.",
  );
}
export function saveForm(s: State, c: Scope, f: Form): State {
  guard(s, c, "hr");
  assert(
    f.name.trim() && f.message.trim() && /^#[0-9a-f]{6}$/i.test(f.color),
    "Nome, mensagem e cor obrigatórios.",
  );
  validateFields(f.fields);
  return {
    ...s,
    forms: [
      {
        ...structuredClone(f),
        version: (s.forms.find((x) => x.id === f.id)?.version ?? 0) + 1,
      },
      ...s.forms.filter((x) => x.id !== f.id),
    ],
  };
}
export function validateCriteria(rows: Criterion[]) {
  for (const x of rows) {
    assert(
      factFields.includes(x.field) &&
        x.expected.trim() &&
        Number.isFinite(x.weight) &&
        x.weight > 0,
      "Critério profissional ou peso inválido.",
    );
    assert(
      !/\b(idade|genero|raca|religiao|deficiencia|estado civil|aparencia|sexo|nascimento|mulher|homem|masculino|feminino|religioso|catolico|evangelico|solteiro|casado|gravida|pcd)\b/.test(
        norm(x.expected),
      ),
      "Não utilize características pessoais protegidas ou irrelevantes.",
    );
  }
}
export function saveJob(s: State, c: Scope, j: Job): State {
  guard(s, c, "hr");
  assert(
    j.title.trim() &&
      j.sector &&
      j.description.trim() &&
      ["CLT", "Estágio", "PJ"].includes(j.contract),
    "Preencha cargo, setor, vínculo e descrição.",
  );
  assert(
    Number.isInteger(j.positions) &&
      j.positions > 0 &&
      Number.isSafeInteger(j.budget) &&
      j.budget! >= 0 &&
      Number.isSafeInteger(j.cost) &&
      j.cost! >= 0,
    "Posições e valores não negativos obrigatórios.",
  );
  assert(
    j.stages.length &&
      new Set(j.stages.map((x) => x.id)).size === j.stages.length,
    "Defina etapas distintas.",
  );
  for (const stage of j.stages) {
    assert(
      stage.name.trim() && Number.isInteger(stage.days) && stage.days >= 0,
      "Nome e prazo de etapa inválidos.",
    );
    validateFields(stage.fields);
    assert(
      stage.fields.every((f) => f.type !== "Arquivo"),
      "Anexe arquivos pela ficha ou pelo formulário de inscrição.",
    );
  }
  validateFields(j.form.fields);
  validateCriteria(j.criteria);
  const old = s.jobs.find((x) => x.id === j.id);
  assert(
    !old || old.state !== "Encerrada",
    "Vaga encerrada; duplique para reabrir.",
  );
  assert(
    s.applications
      .filter((a) => a.job === j.id && a.status === "Ativa")
      .every((a) => j.stages.some((x) => x.id === a.stage)),
    "Etapa ocupada por candidatura ativa não pode ser removida.",
  );
  assert(
    j.positions >=
      s.applications.filter((a) => a.job === j.id && a.status === "Contratada")
        .length,
    "Posições abaixo das contratações realizadas.",
  );
  return {
    ...s,
    jobs: [
      {
        ...structuredClone(j),
        state: old?.state ?? "Rascunho",
        revision: (old?.revision ?? 0) + 1,
        token: old?.token ?? uid(),
        created: old?.created ?? dateNow(),
      },
      ...s.jobs.filter((x) => x.id !== j.id),
    ],
    events: [
      ...s.events,
      ev(c, "Estrutura de vaga salva. Histórico das candidaturas preservado."),
    ],
  };
}
export function jobState(
  s: State,
  c: Scope,
  id: string,
  state: Job["state"],
): State {
  guard(s, c, "hr");
  const j = s.jobs.find((x) => x.id === id);
  assert(j && j.state !== "Encerrada", "Vaga indisponível.");
  if (state === "Publicada")
    assert(
      j.form.fields.length &&
        j.stages.length &&
        j.requirements.trim() &&
        j.activities.trim(),
      "Complete formulário, atividades, requisitos e etapas.",
    );
  return {
    ...s,
    applications:
      state === "Encerrada"
        ? s.applications.map((a) =>
            a.job === id && a.status === "Ativa"
              ? {
                  ...a,
                  status: "Encerrada",
                  reason: "Vaga encerrada pelo RH.",
                  events: [
                    ...a.events,
                    ev(c, "Vaga encerrada pelo RH; histórico preservado."),
                  ],
                }
              : a,
          )
        : s.applications,
    jobs: s.jobs.map((x) =>
      x.id === id
        ? { ...x, state, closed: state === "Encerrada" ? dateNow() : undefined }
        : x,
    ),
    events: [
      ...s.events,
      ev(c, `Vaga ${j.title}: ${state}. Publicação somente demonstrativa.`),
    ],
  };
}
export function duplicateJob(s: State, c: Scope, id: string): State {
  guard(s, c, "hr");
  const j = s.jobs.find((x) => x.id === id);
  assert(j, "Vaga não encontrada.");
  return saveJob(s, c, {
    ...structuredClone(j),
    id: uid(),
    title: j.title + " · cópia",
    state: "Rascunho",
    token: uid(),
  });
}
export function saveCandidate(s: State, c: Scope, p: Candidate): State {
  guard(s, c, "hr");
  assert(
    p.name.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) &&
      p.consent.trim(),
    "Informe nome, e-mail e autorização/finalidade demonstrativa.",
  );
  assert(
    !s.candidates.find((x) => x.id === p.id)?.erased,
    "Cadastro excluído; não reidentificar.",
  );
  assert(
    p.contracts.length && Number.isSafeInteger(p.expected) && p.expected >= 0,
    "Vínculo e pretensão válidos obrigatórios.",
  );
  if (p.cv) validFile(p.cv);
  if (p.portfolio) validFile(p.portfolio);
  for (const f of p.claims)
    assert(
      factFields.includes(f.field) && f.value.trim() && f.source.trim(),
      "Registre evidência profissional e fonte.",
    );
  return {
    ...s,
    candidates: [
      structuredClone(p),
      ...s.candidates.filter((x) => x.id !== p.id),
    ],
  };
}
export function duplicates(
  s: State,
  p: Pick<Candidate, "id" | "email" | "phone" | "name">,
) {
  const phone = p.phone.replace(/\D/g, "");
  return s.candidates.filter(
    (x) =>
      !x.erased &&
      x.id !== p.id &&
      (norm(x.email) === norm(p.email) ||
        (phone.length >= 8 && x.phone.replace(/\D/g, "") === phone) ||
        norm(x.name) === norm(p.name)),
  );
}
function automation(
  s: State,
  a: Application,
  trigger: Rule["trigger"],
  cause: string,
): State {
  const rows = s.rules.filter(
    (r) =>
      r.active &&
      r.trigger === trigger &&
      (!r.sector || r.sector === a.sector) &&
      (!r.contract || r.contract === a.contract),
  );
  const next: State = { ...s };
  if (
    rows.some((r) => r.action === "Preparar proposta") &&
    a.decision === "Aprovado RH" &&
    !s.offers.some((o) => o.application === a.id)
  )
    next.offers = [
      {
        id: uid(),
        application: a.id,
        amount: 0,
        body:
          s.templates.find((t) => t.kind === "Proposta")?.body ??
          "Rascunho demonstrativo a revisar pelo RH.",
        state: "Preparação",
        events: [],
      },
      ...s.offers,
    ];
  return {
    ...next,
    logs: [
      ...s.logs,
      ...rows
        .filter(
          (r) => !s.logs.some((l) => l.rule === r.id && l.cause === cause),
        )
        .map((r) => ({
          id: uid(),
          rule: r.id,
          cause,
          application: a.id,
          action: `${r.action} · simulação local, sem envio ou decisão automática`,
          at: new Date().toISOString(),
        })),
    ],
  };
}
export function linkCandidate(
  s: State,
  c: Scope,
  candidate: string,
  job: string,
  answers: Record<string, string> = {},
  answerFiles: Record<string, Attachment> = {},
): State {
  guard(s, c, "hr");
  const p = s.candidates.find((x) => x.id === candidate && !x.erased),
    j = s.jobs.find((x) => x.id === job);
  assert(
    p && j && j.state !== "Encerrada" && p.contracts.includes(j.contract),
    "Candidato/vaga/vínculo incompatíveis.",
  );
  if (s.applications.some((a) => a.job === job && a.candidate === candidate))
    return s;
  const a: Application = {
    id: uid(),
    candidate,
    job,
    stage: j.stages[0].id,
    stages: structuredClone(j.stages),
    jobTitle: j.title,
    contract: j.contract,
    sector: j.sector,
    entered: dateNow(),
    visits: [{ stage: j.stages[0].id, at: new Date().toISOString() }],
    created: dateNow(),
    assigned: [],
    shareCV: false,
    shareAnswers: false,
    fields: {},
    checks: {},
    answers: structuredClone(answers),
    answerFiles: structuredClone(answerFiles),
    form: structuredClone(j.form),
    status: "Ativa",
    events: [
      ev(c, "Candidatura vinculada localmente, sem aviso ao candidato."),
    ],
  };
  return automation(
    { ...s, applications: [a, ...s.applications] },
    a,
    "Nova candidatura",
    a.id,
  );
}
export function updateStage(
  s: State,
  c: Scope,
  id: string,
  fields: Record<string, string>,
  checks: Record<string, boolean>,
): State {
  guard(s, c, "hr");
  const a = s.applications.find((a) => a.id === id);
  assert(a?.status === "Ativa", "Candidatura não editável.");
  return {
    ...s,
    applications: s.applications.map((x) =>
      x.id === id ? { ...x, fields, checks } : x,
    ),
  };
}
export function moveApplication(
  s: State,
  c: Scope,
  id: string,
  target: string,
  reason: string,
): State {
  guard(s, c, "hr");
  const a = s.applications.find((x) => x.id === id),
    j = s.jobs.find((x) => x.id === a?.job),
    stage = j?.stages.find((x) => x.id === target);
  assert(
    a && j && stage && a.status === "Ativa" && j.state !== "Encerrada",
    "Movimentação indisponível.",
  );
  assert(reason.trim(), "Registre o motivo da movimentação.");
  if (a.stage === target) return s;
  const current = a.stages.find((x) => x.id === a.stage)!;
  if (
    j.stages.findIndex((x) => x.id === target) >
    j.stages.findIndex((x) => x.id === a.stage)
  ) {
    assert(
      current.tasks.every(
        (t) => !t.required || a.checks[`${current.id}:${t.id}`],
      ),
      "Conclua os itens obrigatórios da etapa.",
    );
    assert(
      visibleStageFields(current, a.fields).every(
        (f) => !f.required || a.fields[`${current.id}:${f.id}`]?.trim(),
      ),
      "Preencha os campos obrigatórios da etapa.",
    );
  }
  const next = {
    ...a,
    stage: target,
    visits: [...a.visits, { stage: target, at: new Date().toISOString() }],
    entered: dateNow(),
    stages: a.stages.some((x) => x.id === target)
      ? a.stages
      : [...a.stages, structuredClone(stage)],
    events: [
      ...a.events,
      ev(c, `Movimentação: ${current.name} → ${stage.name}. ${reason}`),
    ],
  };
  return automation(
    { ...s, applications: s.applications.map((x) => (x.id === id ? next : x)) },
    next,
    "Mudança de etapa",
    next.events.at(-1)!.id,
  );
}
export function assign(
  s: State,
  c: Scope,
  id: string,
  user: string,
  shareCV: boolean,
  shareAnswers: boolean,
): State {
  guard(s, c, "hr");
  assert(
    user.trim() && s.applications.some((x) => x.id === id),
    "Informe uma liderança responsável.",
  );
  return {
    ...s,
    applications: s.applications.map((a) =>
      a.id === id
        ? {
            ...a,
            assigned: [...new Set([...a.assigned, user])],
            shareCV,
            shareAnswers,
            events: [
              ...a.events,
              ev(
                c,
                "Acesso técnico designado pelo RH. Perfil, orçamento e notas privadas continuam restritos.",
              ),
            ],
          }
        : a,
    ),
  };
}
export function revokeAssignment(
  s: State,
  c: Scope,
  id: string,
  user: string,
): State {
  guard(s, c, "hr");
  return {
    ...s,
    applications: s.applications.map((a) =>
      a.id === id
        ? { ...a, assigned: a.assigned.filter((x) => x !== user) }
        : a,
    ),
  };
}
export function addNote(
  s: State,
  c: Scope,
  n: Omit<Note, "id" | "by" | "at">,
): State {
  guard(s, c);
  const a = s.applications.find((x) => x.id === n.application);
  assert(
    a && (c.rh || (assigned(a, c) && n.kind === "Técnica")),
    "Avaliação técnica não designada ou nota restrita.",
  );
  assert(
    n.text.trim() && (!n.shared || n.kind !== "Confidencial RH"),
    "Nota vazia ou confidencial compartilhada.",
  );
  return {
    ...s,
    notes: [
      {
        ...n,
        id: uid(),
        by: c.name,
        at: new Date().toISOString(),
        shared: c.rh ? n.shared : true,
      },
      ...s.notes,
    ],
  };
}
export function schedule(s: State, c: Scope, x: Omit<Interview, "id">): State {
  guard(s, c, "hr");
  const a = s.applications.find((a) => a.id === x.application);
  assert(
    a &&
      x.title.trim() &&
      x.responsible.trim() &&
      Number.isFinite(Date.parse(`${x.date}T${x.time}:00-03:00`)),
    "Informe entrevista, responsável, data e horário de Brasília válidos.",
  );
  const next = { ...s, interviews: [{ ...x, id: uid() }, ...s.interviews] };
  return automation(next, a, "Entrevista agendada", next.interviews[0].id);
}
export function saveTemplate(s: State, c: Scope, t: Template): State {
  guard(s, c, "hr");
  assert(
    t.name.trim() && (t.body.trim() || t.questions.length || t.stages?.length),
    "Nome e conteúdo do modelo obrigatórios.",
  );
  return {
    ...s,
    templates: [
      {
        ...structuredClone(t),
        version: (s.templates.find((x) => x.id === t.id)?.version ?? 0) + 1,
      },
      ...s.templates.filter((x) => x.id !== t.id),
    ],
  };
}
export function inviteAssessment(
  s: State,
  c: Scope,
  candidate: string,
  template: string,
): State {
  guard(s, c, "hr");
  const p = s.candidates.find((x) => x.id === candidate && !x.erased),
    t = s.templates.find((x) => x.id === template);
  assert(
    p && t && ["DISC", "Temperamentos"].includes(t.kind) && t.questions.length,
    "Instrumento ou candidato indisponível.",
  );
  if (
    s.assessments.some(
      (x) =>
        x.candidate === candidate &&
        x.template.id === t.id &&
        x.template.version === t.version,
    )
  )
    return s;
  const x: Assessment = {
    id: uid(),
    candidate,
    template: structuredClone(t),
    token: uid(),
    answers: {},
    created: dateNow(),
  };
  const a = s.applications.find((x) => x.candidate === candidate);
  const next = { ...s, assessments: [x, ...s.assessments] };
  return a ? automation(next, a, "Avaliação pendente", x.id) : next;
}
export function answerAssessment(
  s: State,
  c: Scope,
  id: string,
  answers: Record<string, string>,
): State {
  guard(s, c, "hr");
  const x = s.assessments.find((x) => x.id === id);
  assert(
    x &&
      !x.completedAt &&
      x.template.questions.every((_, i) => answers[String(i)]?.trim()),
    "Responda ao instrumento demonstrativo pendente.",
  );
  return {
    ...s,
    assessments: s.assessments.map((x) =>
      x.id === id
        ? { ...x, answers, completedAt: new Date().toISOString() }
        : x,
    ),
  };
}
export type MatchResult = {
  percentage: number | null;
  coverage: number;
  criteria: {
    criterion: Criterion;
    status: "Comprovado" | "Não atendido" | "Não informado";
    evidence: string;
  }[];
  summary: string;
  questions: string[];
};
export function match(job: Job, p: Candidate): MatchResult {
  validateCriteria(job.criteria);
  const rows = job.criteria.map((criterion) => {
    const hits = p.claims.filter(
        (f) =>
          f.field === criterion.field &&
          norm(f.value).includes(norm(criterion.expected)),
      ),
      positive = hits.filter((x) => x.status === "Documentado"),
      negative = hits.filter((x) => x.status === "Não atende");
    const status =
      positive.length && !negative.length
        ? "Comprovado"
        : negative.length && !positive.length
          ? "Não atendido"
          : "Não informado";
    return {
      criterion,
      status: status as MatchResult["criteria"][number]["status"],
      evidence:
        positive.length && negative.length
          ? "Fontes conflitantes: confirmar com a pessoa."
          : hits.map((x) => `${x.value} · ${x.source}`).join("; ") ||
            "Informação não documentada; confirmar na entrevista.",
    };
  });
  const known = rows.filter((r) => r.status !== "Não informado"),
    den = known.reduce((n, r) => n + r.criterion.weight, 0);
  return {
    percentage: den
      ? Math.round(
          (known
            .filter((r) => r.status === "Comprovado")
            .reduce((n, r) => n + r.criterion.weight, 0) /
            den) *
            100,
        )
      : null,
    coverage: rows.length ? Math.round((known.length / rows.length) * 100) : 0,
    criteria: rows,
    summary:
      p.summary ||
      `${p.name}: ${p.education || "formação a confirmar"}; ${p.experience || "experiência a confirmar"}.`,
    questions: rows
      .filter((r) => r.status !== "Comprovado")
      .map(
        (r) =>
          `Você pode contextualizar sua experiência com ${r.criterion.expected} e compartilhar um exemplo profissional?`,
      ),
  };
}
export function talentSearch(s: State, f: TalentFilter) {
  return s.candidates
    .filter((p) => !p.erased)
    .filter((p) => {
      const text = [p.name, p.email, p.summary, ...p.tags].join(" "),
        str = (value: string, q: string) => !q || norm(value).includes(norm(q));
      const job = s.jobs.find((j) => j.id === f.job),
        score = job ? match(job, p) : undefined;
      return (
        str(text, f.search) &&
        str(p.sector, f.sector) &&
        str(p.education, f.education) &&
        str(p.experience, f.experience) &&
        str(p.skills, f.skills) &&
        str(p.software, f.software) &&
        str(p.city, f.city) &&
        str(p.availability, f.availability) &&
        (!f.salary || p.expected <= Number(f.salary) * 100) &&
        (!f.contract || p.contracts.includes(f.contract as Contract)) &&
        str(p.source, f.source) &&
        (!f.from || p.created >= f.from) &&
        (!f.until || p.created <= f.until) &&
        (!f.compatibility ||
          (score?.percentage !== null &&
            score?.percentage !== undefined &&
            score.percentage >= Number(f.compatibility)))
      );
    });
}
export function saveFilter(
  s: State,
  c: Scope,
  name: string,
  value: TalentFilter,
): State {
  guard(s, c, "hr");
  assert(name.trim(), "Nomeie a consulta.");
  return {
    ...s,
    filters: [{ id: uid(), name, value: structuredClone(value) }, ...s.filters],
  };
}
export function saveRule(s: State, c: Scope, r: Rule): State {
  guard(s, c, "hr");
  assert(
    r.name.trim() && triggers.includes(r.trigger) && actions.includes(r.action),
    "Configure gatilho e ação demonstrativos.",
  );
  return { ...s, rules: [r, ...s.rules.filter((x) => x.id !== r.id)] };
}
export function decide(
  s: State,
  c: Scope,
  id: string,
  approve: boolean,
  reason: string,
): State {
  guard(s, c, "hr");
  const a = s.applications.find((x) => x.id === id);
  assert(
    a?.status === "Ativa" && reason.trim(),
    "Candidatura ativa e parecer obrigatórios.",
  );
  const next = {
    ...a,
    decision: approve ? ("Aprovado RH" as const) : ("Não selecionado" as const),
    status: approve ? ("Ativa" as const) : ("Encerrada" as const),
    reason,
    events: [
      ...a.events,
      ev(
        c,
        `${approve ? "RH aprovou a continuidade" : "Processo encerrado pelo RH"}: ${reason}. Sem contratação automática.`,
      ),
    ],
  };
  const result = {
    ...s,
    applications: s.applications.map((x) => (x.id === id ? next : x)),
  };
  return approve
    ? automation(result, next, "Aprovação RH", next.events.at(-1)!.id)
    : result;
}
export function saveOffer(
  s: State,
  c: Scope,
  application: string,
  amount: number,
  body: string,
  template?: string,
): State {
  guard(s, c, "hr");
  const a = s.applications.find((a) => a.id === application);
  assert(
    a?.decision === "Aprovado RH" &&
      a.status === "Ativa" &&
      Number.isSafeInteger(amount) &&
      amount > 0 &&
      body.trim(),
    "RH deve aprovar antes de preparar uma proposta válida.",
  );
  const old = s.offers.find((x) => x.application === application);
  assert(
    !old || old.state === "Preparação",
    "Proposta já encaminhada; preserve o histórico.",
  );
  const t = s.templates.find((x) => x.id === template);
  const x: Offer = {
    id: old?.id ?? uid(),
    application,
    amount,
    body,
    state: "Preparação",
    template: t ? structuredClone(t) : undefined,
    events: [
      ...(old?.events ?? []),
      ev(c, "Proposta preparada, sem envio real."),
    ],
  };
  return {
    ...s,
    offers: [x, ...s.offers.filter((y) => y.application !== application)],
  };
}
const funded = (s: State, a: Application, amount: number) =>
  amount <= (s.jobs.find((j) => j.id === a.job)?.budget ?? 0) ||
  s.exceptions.some(
    (x) =>
      x.application === a.id && x.amount === amount && x.state === "Aprovada",
  );
export function offerState(
  s: State,
  c: Scope,
  id: string,
  state: Offer["state"],
): State {
  guard(s, c, "hr");
  const x = s.offers.find((x) => x.id === id),
    a = s.applications.find((a) => a.id === x?.application);
  assert(
    x && a?.status === "Ativa" && a.decision === "Aprovado RH",
    "Proposta ou candidatura indisponível.",
  );
  assert(
    (x.state === "Preparação" && state === "Enviada (simulação)") ||
      (x.state === "Enviada (simulação)" &&
        ["Aceita", "Recusada"].includes(state)),
    "Transição de proposta inválida.",
  );
  assert(
    x.amount > 0,
    "Revise e preencha o valor da proposta antes do envio simulado.",
  );
  assert(
    funded(s, a, x.amount),
    "Solicite aprovação da exceção financeira pela Diretoria.",
  );
  const next = {
    ...s,
    offers: s.offers.map((y) =>
      y.id === id
        ? {
            ...y,
            state,
            events: [
              ...y.events,
              ev(
                c,
                `Proposta ${state}. Registro local, sem mensagem ou contrato real.`,
              ),
            ],
          }
        : y,
    ),
  };
  return state === "Aceita"
    ? automation(next, a, "Proposta aceita", `${id}:aceita`)
    : next;
}
export function requestException(
  s: State,
  c: Scope,
  application: string,
  amount: number,
  reason: string,
): State {
  guard(s, c, "hr");
  assert(
    s.applications.some((x) => x.id === application) &&
      Number.isSafeInteger(amount) &&
      amount >= 0 &&
      reason.trim(),
    "Informe candidatura, valor e justificativa.",
  );
  assert(
    !s.exceptions.some(
      (x) =>
        x.application === application &&
        x.amount === amount &&
        x.state === "Pendente",
    ),
    "Exceção já pendente.",
  );
  return {
    ...s,
    exceptions: [
      {
        id: uid(),
        application,
        amount,
        reason,
        by: c.user,
        state: "Pendente",
        at: new Date().toISOString(),
      },
      ...s.exceptions,
    ],
  };
}
export function reviewException(
  s: State,
  c: Scope,
  id: string,
  approve: boolean,
  comment: string,
): State {
  guard(s, c, "director");
  const x = s.exceptions.find((x) => x.id === id);
  assert(
    x?.state === "Pendente" && x.by !== c.user && comment.trim(),
    "Exceção pendente, parecer e revisor distinto obrigatórios.",
  );
  return {
    ...s,
    exceptions: s.exceptions.map((x) =>
      x.id === id
        ? {
            ...x,
            state: approve ? "Aprovada" : "Recusada",
            reviewedBy: c.name,
            comment,
          }
        : x,
    ),
  };
}
export function formalize(
  s: State,
  c: Scope,
  application: string,
  confirmed: boolean,
): State {
  guard(s, c, "hr");
  const a = s.applications.find((x) => x.id === application),
    o = s.offers.find((x) => x.application === application),
    j = s.jobs.find((x) => x.id === a?.job);
  assert(
    a &&
      j &&
      confirmed &&
      a.decision === "Aprovado RH" &&
      o?.state === "Aceita" &&
      funded(s, a, o.amount),
    "Confirme formalização, aprovação RH, proposta aceita e orçamento autorizado.",
  );
  if (a.status === "Contratada") return s;
  assert(
    a.status === "Ativa" &&
      j.state !== "Encerrada" &&
      s.applications.filter((x) => x.job === j.id && x.status === "Contratada")
        .length < j.positions,
    "Vaga sem posições disponíveis.",
  );
  return {
    ...s,
    applications: s.applications.map((x) =>
      x.id === application
        ? {
            ...x,
            status: "Contratada",
            hiredAt: dateNow(),
            events: [
              ...x.events,
              ev(
                c,
                "Formalização confirmada apenas na demonstração, sem criação de pessoa, vínculo ou conta real.",
              ),
            ],
          }
        : x,
    ),
  };
}
export function prepareHandoff(
  s: State,
  c: Scope,
  application: string,
  fields: string[],
): State {
  guard(s, c, "hr");
  const a = s.applications.find((x) => x.id === application),
    p = s.candidates.find((x) => x.id === a?.candidate && !x.erased);
  assert(
    a?.status === "Contratada" && p,
    "Contratação deve estar formalizada e confirmada pelo RH.",
  );
  if (s.handoffs.some((h) => h.application === application)) return s;
  assert(
    fields.includes("name") &&
      fields.every((f) => ["name", "email", "phone", "city"].includes(f)),
    "Autorize somente os campos cadastrais necessários, incluindo nome.",
  );
  return {
    ...s,
    handoffs: [
      {
        id: `recruitment:${s.org}:${application}`,
        candidate: p.id,
        application,
        org: c.org,
        by: c.name,
        at: new Date().toISOString(),
        fields: Object.fromEntries(
          fields.map((k) => [k, String(p[k as keyof Candidate])]),
        ),
        destinations: [
          "Base Central de Pessoas",
          "Admissão e contratação",
          "Onboarding",
        ],
        state: "Preparada",
      },
      ...s.handoffs,
    ],
  };
}
export function privacySettings(
  s: State,
  c: Scope,
  purpose: string,
  days: number,
): State {
  guard(s, c, "hr");
  assert(
    purpose.trim() && Number.isInteger(days) && days > 0 && days <= 3650,
    "Finalidade e prazo demonstrativo de 1 a 3.650 dias obrigatórios.",
  );
  return { ...s, privacy: { purpose, days, version: s.privacy.version + 1 } };
}
export function erase(s: State, c: Scope, id: string, reason: string): State {
  guard(s, c, "hr");
  const p = s.candidates.find((x) => x.id === id);
  assert(
    p && !p.erased && reason.trim(),
    "Informe cadastro e justificativa para anonimização local.",
  );
  const ids = new Set(
    s.applications.filter((x) => x.candidate === id).map((x) => x.id),
  );
  return {
    ...s,
    candidates: s.candidates.map((x) =>
      x.id === id
        ? {
            ...x,
            name: "Cadastro removido",
            email: "",
            phone: "",
            city: "",
            education: "",
            experience: "",
            skills: "",
            software: "",
            availability: "",
            expected: 0,
            source: "",
            referral: "",
            tags: [],
            claims: [],
            summary: "",
            cv: undefined,
            portfolio: undefined,
            consent: "Dados pessoais removidos localmente",
            erased: true,
          }
        : x,
    ),
    applications: s.applications.map((a) =>
      ids.has(a.id)
        ? {
            ...a,
            status: a.status === "Contratada" ? a.status : "Encerrada",
            reason: undefined,
            answers: {},
            answerFiles: {},
            fields: {},
            events: [
              ev(
                c,
                "Dados pessoais removidos; indicadores anônimos preservados.",
              ),
            ],
          }
        : a,
    ),
    notes: s.notes.filter((n) => !ids.has(n.application)),
    analyses: s.analyses.filter((x) => x.candidate !== id),
    assessments: s.assessments.filter((x) => x.candidate !== id),
    interviews: s.interviews.map((x) =>
      ids.has(x.application)
        ? { ...x, title: "Registro anonimizado", note: "" }
        : x,
    ),
    offers: s.offers.map((x) =>
      ids.has(x.application)
        ? { ...x, body: "Dados removidos", events: [], template: undefined }
        : x,
    ),
    exceptions: s.exceptions.map((x) =>
      ids.has(x.application)
        ? { ...x, reason: "Dados removidos", comment: undefined }
        : x,
    ),
    handoffs: s.handoffs.map((h) =>
      h.candidate === id ? { ...h, fields: {} } : h,
    ),
  };
}
export function submitCareer(
  s: State,
  c: Scope,
  job: string | undefined,
  form: Form,
  answers: Record<string, string>,
  files: Record<string, Attachment>,
  consent: boolean,
  token?: string,
): State {
  guard(s, c, "hr");
  assert(consent, "Confirme o uso exclusivamente fictício do formulário.");
  const j = job ? s.jobs.find((j) => j.id === job) : undefined;
  assert(
    !job ||
      (j?.state === "Publicada" &&
        (j.visibility === "Listada" || j.token === token)),
    "Vaga não publicada ou link exclusivo inválido.",
  );
  const canonical = j?.form ?? s.forms.find((x) => x.id === form.id);
  assert(canonical, "Formulário indisponível.");
  const visible = visibleFields(canonical, answers);
  for (const f of visible) {
    assert(
      !f.required || answers[f.id]?.trim() || files[f.id],
      "Preencha os campos obrigatórios visíveis.",
    );
    if (f.type === "E-mail" && answers[f.id])
      assert(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[f.id]),
        "E-mail inválido.",
      );
    if (files[f.id]) validFile(files[f.id]);
  }
  const map = (name: string) =>
      answers[visible.find((f) => f.mapping === name)?.id ?? ""] ?? "",
    email = map("email"),
    existing = s.candidates.find(
      (p) => !p.erased && norm(p.email) === norm(email),
    );
  assert(
    !s.candidates.some((p) => p.erased && p.email === email),
    "Cadastro removido.",
  );
  const now = dateNow(),
    p: Candidate = existing ?? {
      id: uid(),
      name: map("name"),
      email,
      phone: map("phone"),
      city: map("city"),
      sector: map("sector"),
      education: map("education"),
      experience: map("experience"),
      skills: map("skills"),
      software: map("software"),
      availability: map("availability"),
      expected: Math.round(Number(map("expected") || 0) * 100),
      contracts: j ? [j.contract] : ["CLT", "Estágio", "PJ"],
      source: job ? "Página de Carreiras" : "Banco de Talentos",
      referral: "",
      tags: [],
      created: now,
      retentionUntil: new Date(
        Date.parse(now + "T12:00:00Z") + s.privacy.days * 86400000,
      )
        .toISOString()
        .slice(0, 10),
      consent: `Demonstração autorizada: finalidade v${s.privacy.version}`,
      summary: map("notes"),
      claims: [],
      cv: files[visible.find((f) => f.mapping === "cv")?.id ?? ""],
      portfolio:
        files[visible.find((f) => f.mapping === "portfolio")?.id ?? ""],
    };
  const next = existing ? s : saveCandidate(s, c, p),
    clean = Object.fromEntries(
      visible
        .filter((f) => answers[f.id] !== undefined)
        .map((f) => [f.id, answers[f.id]]),
    ),
    cleanFiles = Object.fromEntries(
      visible.filter((f) => files[f.id]).map((f) => [f.id, files[f.id]]),
    );
  return job ? linkCandidate(next, c, p.id, job, clean, cleanFiles) : next;
}

export function analyzeBatch(
  s: State,
  c: Scope,
  job: string,
  ids: string[],
): State {
  guard(s, c, "hr");
  const j = s.jobs.find((j) => j.id === job);
  assert(
    j && j.criteria.length && ids.length,
    "Selecione vaga com critérios e candidatos.",
  );
  const rows = [...new Set(ids)].map((id) => {
    const p = s.candidates.find((p) => p.id === id && !p.erased);
    assert(p, "Candidato indisponível.");
    return {
      id: uid(),
      candidate: id,
      job,
      jobRevision: j.revision,
      at: new Date().toISOString(),
      result: match(j, p),
    };
  });
  return { ...s, analyses: [...rows, ...s.analyses] };
}

export function visibleStageFields(
  stage: Stage,
  answers: Record<string, string>,
) {
  return visibleFields(
    {
      id: stage.id,
      name: stage.name,
      fields: stage.fields,
      version: 1,
      color: "#000000",
      message: "",
    },
    Object.fromEntries(
      stage.fields.map((f) => [f.id, answers[`${stage.id}:${f.id}`] ?? ""]),
    ),
  );
}
/** Conversion counts people who visited the previous step and then this step, not all visits divided by an unrelated pool. */
export function funnelConversion(
  apps: Application[],
  stage: string,
  previous?: string,
) {
  const base = previous
    ? apps.filter((a) => a.visits.some((v) => v.stage === previous))
    : apps;
  const converted = base.filter((a) => {
    if (!previous) return a.visits.some((v) => v.stage === stage);
    const at = a.visits.findIndex((v) => v.stage === previous);
    return a.visits.slice(at + 1).some((v) => v.stage === stage);
  });
  return base.length
    ? Math.round((converted.length / base.length) * 100)
    : null;
}
