import {
  type Scope,
  type Contract,
  assert,
  uid,
  dateNow,
  validDate,
} from "../career/model";
import {
  automation,
  type State,
  type Application,
  type Candidate,
  type Form,
  type Job,
  type Criterion,
  guard,
  projection,
  ev,
  visibleFields,
  validateFields,
  validateCriteria,
  validFile,
  saveCandidate,
  prepareHandoff,
  match,
  erase,
} from "./model";
import {
  type PipelineStage,
  type Admission,
  type AdmissionStage,
  type CentralConfig,
  type Relationship,
  type WorkflowView,
  type WorkflowFilters,
  experienceLevels,
} from "./workflow-types";
export const workflowAllowed = (c: Scope, view: WorkflowView) =>
  c.rh ||
  (c.director &&
    ["processo-seletivo", "vagas", "indicadores"].includes(view)) ||
  (c.leader && view === "processo-seletivo");
const now = () => new Date().toISOString();
const addDays = (days: number) =>
  new Date(Date.parse(dateNow() + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
export function initialPipeline(): PipelineStage[] {
  const rows: [string, PipelineStage["kind"], string][] = [
    ["Entrada", "entry", "#64748b"],
    ["Triagem", "normal", "#f59e0b"],
    ["Qualificados", "qualified", "#10b981"],
    ["Entrevista Coletiva", "normal", "#8b5cf6"],
    ["Entrevista Individual", "normal", "#6366f1"],
    ["Entrevista com Gestor", "normal", "#0ea5e9"],
    ["Avaliação Técnica", "normal", "#06b6d4"],
    ["Proposta", "normal", "#f97316"],
    ["Contratados", "hired", "#16a34a"],
    ["Banco de Talentos", "bank", "#a855f7"],
    ["Desqualificados", "disqualified", "#78716c"],
    ["Reprovados", "rejected", "#ef4444"],
    ["Não Aceitou a Proposta", "declined", "#b45309"],
  ];
  return rows.map(([name, kind, color], i) => ({
    id: "pipeline-" + i,
    name,
    kind,
    color,
    days: i < 3 ? 3 : 7,
    fields: [],
    tasks: [],
  }));
}
function admissionFlow(contract: Contract): AdmissionStage[] {
  return (
    contract === "CLT"
      ? [
          "Nova admissão",
          "Encaminhado à Flash",
          "Admissão em andamento",
          "Admissão confirmada",
          "Finalizado",
        ]
      : [
          "Novas admissões",
          "Coleta da documentação",
          "Elaboração do contrato",
          "Aguardando assinatura",
          "Contratação finalizada",
          "Cancelados",
        ]
  ).map((name, i, rows) => ({
    id: `admission-${contract}-${i}`,
    name,
    color:
      i === rows.length - 1
        ? contract === "CLT"
          ? "#16a34a"
          : "#ef4444"
        : "#f97316",
    purpose:
      contract === "CLT"
        ? i === 3
          ? "confirmed"
          : i === 4
            ? "final"
            : "normal"
        : i === 4
          ? "final"
          : i === 5
            ? "canceled"
            : "normal",
    days: 3,
    fields: [],
    tasks: [],
  }));
}
function defaultCentral(s: State): CentralConfig {
  const formId = s.forms[0]?.id ?? "bank-form";
  const doc = (name: string, instructions: string) => ({
    id: uid(),
    name,
    required: true,
    instructions,
  });
  const form = (contract: Contract): Form => ({
    id: "admission-form-" + contract,
    name: `Informações de contratação ${contract} · demonstração`,
    version: 1,
    color: "#e85d0a",
    message: "Informações fictícias salvas apenas neste navegador.",
    fields:
      contract === "CLT"
        ? []
        : [
            {
              id: "contract-party",
              label:
                contract === "PJ"
                  ? "Identificação cadastral da prestação de serviços"
                  : "Instituição de ensino e curso",
              type: "Texto",
              mapping: "",
              required: true,
              options: [],
            },
          ],
  });
  return {
    stages: initialPipeline(),
    cards: [
      "city",
      "area",
      "experience",
      "job",
      "tags",
      "attachments",
      "stageTime",
      "totalTime",
      "alerts",
    ],
    tags: ["Prioridade", "Retornar contato", "Portfólio", "BIM"],
    formId,
    privacyNotice:
      "Demonstração protegida. Use exclusivamente informações e documentos fictícios. Finalidade, retenção e direitos serão formalizados antes de coleta pública.",
    admissionStages: {
      CLT: admissionFlow("CLT"),
      Estágio: admissionFlow("Estágio"),
      PJ: admissionFlow("PJ"),
    },
    documents: {
      CLT: [],
      Estágio: [
        doc(
          "Termo de compromisso assinado",
          "Documento fictício para testar a formalização de estágio.",
        ),
      ],
      PJ: [
        doc(
          "Contrato de prestação assinado",
          "Arquivo fictício para testar a formalização contratual PJ.",
        ),
      ],
    },
    admissionForms: {
      CLT: form("CLT"),
      Estágio: form("Estágio"),
      PJ: form("PJ"),
    },
    customCriteria: structuredClone(s.jobs[0]?.criteria ?? []),
  };
}
const relation = (
  c: Scope,
  candidate: string,
  kind: Relationship["kind"],
  text: string,
  application?: string,
): Relationship => ({
  id: uid(),
  candidate,
  kind,
  text,
  application,
  at: now(),
  by: c.name,
});
/** Same namespace. Upgrade never discards prior candidates, forms, notes, answers or assessments. */
export function upgradeWorkflow(input: State, c: Scope): State {
  assert(input.org === c.org, "Organização não autorizada.");
  if (input.workflowVersion === 2) return input;
  const s = structuredClone(input),
    central = defaultCentral(s),
    latest = new Set<string>();
  s.applications = [...s.applications]
    .sort((a, b) => b.created.localeCompare(a.created))
    .map((a) => {
      const historical = latest.has(a.candidate);
      latest.add(a.candidate);
      const old = a.stage,
        idx = Math.max(0, Number(old.split("-").at(-1)) || 0),
        mapped =
          a.status === "Contratada"
            ? 8
            : a.status === "Encerrada"
              ? 11
              : ([0, 1, 4, 6, 7, 8][idx] ?? 0);
      return {
        ...a,
        legacy: {
          stage: a.stage,
          status: a.status,
          job: a.job,
          stages: structuredClone(a.stages),
          visits: structuredClone(a.visits),
        },
        historical,
        cycle: 1,
        stage: central.stages[mapped].id,
        stages: structuredClone(central.stages),
        visits: a.visits.map((v) => ({
          ...v,
          stage:
            central.stages[
              [0, 1, 4, 6, 7, 8][Number(v.stage.split("-").at(-1))] ?? 0
            ].id,
        })),
        events: [
          ...a.events,
          {
            id: uid(),
            at: now(),
            by: "Atualização local de estrutura",
            text: "Processo preservado na migração local para o Kanban centralizado.",
          },
        ],
      };
    });
  const forms = s.forms.map((f) => ({
    ...f,
    fields: f.fields.map((x) =>
      x.mapping === "experience"
        ? { ...x, type: "Seleção" as const, options: [...experienceLevels] }
        : x,
    ),
  }));
  const employments = s.applications
    .filter((a) => a.status === "Contratada")
    .map((a) => ({
      id: "employment:" + a.id,
      org: s.org,
      candidate: a.candidate,
      application: a.id,
      admission: "legacy:" + a.id,
      job: a.job,
      contract: a.contract,
      start: a.hiredAt ?? a.created,
      confirmedAt: a.hiredAt ?? a.created,
      status: "Ativo" as const,
      origin:
        s.candidates.find((p) => p.id === a.candidate)?.source ??
        "Não informado",
    }));
  return {
    ...s,
    forms,
    workflowVersion: 2,
    central,
    admissions: [],
    employments,
    relationships: s.applications.map((a) => ({
      id: uid(),
      candidate: a.candidate,
      application: a.id,
      at: a.created + "T12:00:00Z",
      by: "Histórico demonstrativo preservado",
      kind:
        a.status === "Contratada"
          ? ("Contratação" as const)
          : ("Entrada" as const),
      text: `Processo anterior preservado: ${a.jobTitle} · ${a.legacy?.status}.`,
    })),
    events: [
      ...s.events,
      ev(c, "Estrutura local atualizada. Nenhum registro anterior removido."),
    ],
  };
}
export function projectWorkflow(input: State, c: Scope): State {
  const s = upgradeWorkflow(input, c),
    base = projection(s, c);
  if (c.rh) return s;
  const clean = (central: CentralConfig): CentralConfig => ({
    ...central,
    stages: central.stages.map((st) => ({ ...st, fields: [], tasks: [] })),
    admissionStages: Object.fromEntries(
      Object.entries(central.admissionStages).map(([k, rows]) => [
        k,
        rows.map((st) => ({ ...st, fields: [], tasks: [] })),
      ]),
    ) as unknown as CentralConfig["admissionStages"],
  });
  base.workflowQueries = [];
  if (c.leader) base.jobs = base.jobs.map((j) => ({ ...j, observations: "" }));
  base.candidates = base.candidates.map((p) => ({
    ...p,
    validatedLevel: undefined,
    rehire: undefined,
  }));
  base.applications = base.applications.map((a) => ({
    ...a,
    legacy: undefined,
  }));
  if (c.director)
    return {
      ...base,
      central: {
        ...clean(s.central!),
        privacyNotice: "",
        documents: { CLT: [], Estágio: [], PJ: [] },
        admissionForms: {
          CLT: { ...s.central!.admissionForms.CLT, fields: [] },
          Estágio: { ...s.central!.admissionForms.Estágio, fields: [] },
          PJ: { ...s.central!.admissionForms.PJ, fields: [] },
        },
        customCriteria: [],
      },
      admissions: s.admissions!.map((a) => ({
        ...a,
        fields: {},
        checks: {},
        files: {},
        answers: {},
        notes: "",
        externalRef: "",
        token: "",
        rules: [],
        form: { ...a.form, fields: [] },
        events: [],
        stages: a.stages.map((st) => ({ ...st, fields: [], tasks: [] })),
      })),
      relationships: [],
      employments: s.employments,
    };
  return {
    ...base,
    central: {
      ...clean(s.central!),
      privacyNotice: "",
      stages: s.central!.stages.map((st) => ({ ...st, fields: [], tasks: [] })),
      documents: { CLT: [], Estágio: [], PJ: [] },
      admissionForms: {
        CLT: { ...s.central!.admissionForms.CLT, fields: [] },
        Estágio: { ...s.central!.admissionForms.Estágio, fields: [] },
        PJ: { ...s.central!.admissionForms.PJ, fields: [] },
      },
      customCriteria: [],
    },
    admissions: [],
    employments: [],
    relationships: [],
  };
}
export const currentCycles = (s: State, includeArchived = false) =>
  s.applications.filter(
    (a) =>
      (!a.historical || (includeArchived && !!a.archived)) &&
      (includeArchived || !a.archived) &&
      s.candidates.some(
        (p) => p.id === a.candidate && !p.erased && !p.mergedInto,
      ),
  );
export const stageOf = (s: State, id: string) =>
  s.central!.stages.find((st) => st.id === id);
export const normalized = (x: string) =>
  x
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function assertWorkflow(s: State, c: Scope) {
  guard(s, c, "hr");
  assert(
    s.workflowVersion === 2 && s.central,
    "Estrutura central indisponível.",
  );
}
function newCycle(
  s: State,
  c: Scope,
  p: Candidate,
  form?: Form,
  answers: Record<string, string> = {},
  files: Application["answerFiles"] = {},
): Application {
  return {
    id: uid(),
    candidate: p.id,
    job: "",
    jobTitle: "Sem vaga vinculada",
    contract: p.contracts[0] ?? "CLT",
    sector: p.sector,
    stage: s.central!.stages.find((st) => st.kind === "entry")!.id,
    stages: structuredClone(s.central!.stages),
    entered: dateNow(),
    created: dateNow(),
    visits: [
      {
        stage: s.central!.stages.find((st) => st.kind === "entry")!.id,
        at: now(),
      },
    ],
    assigned: [],
    shareCV: false,
    shareAnswers: false,
    fields: {},
    checks: {},
    answers,
    answerFiles: files,
    form: structuredClone(
      form ?? s.forms.find((f) => f.id === s.central!.formId) ?? s.forms[0],
    ),
    status: "Ativa",
    events: [
      ev(
        c,
        "Currículo incluído em Entrada, sem candidatura obrigatória a uma vaga.",
      ),
    ],
    cycle:
      Math.max(
        0,
        ...s.applications
          .filter((a) => a.candidate === p.id)
          .map((a) => a.cycle ?? 1),
      ) + 1,
  };
}
export function intakeCandidate(s: State, c: Scope, p: Candidate): State {
  assertWorkflow(s, c);
  let next = saveCandidate(s, c, p);
  const existing = currentCycles(next).find(
    (a) =>
      a.candidate === p.id &&
      a.status === "Ativa" &&
      ["normal", "entry", "qualified"].includes(
        stageOf(next, a.stage)?.kind ?? "",
      ),
  );
  if (existing) return next;
  next = {
    ...next,
    applications: next.applications.map((a) =>
      a.candidate === p.id && !a.historical ? { ...a, historical: true } : a,
    ),
  };
  const a = newCycle(next, c, p);
  return {
    ...next,
    applications: [a, ...next.applications],
    relationships: [
      ...(next.relationships ?? []),
      relation(
        c,
        p.id,
        "Entrada",
        "Novo currículo recebido no processo central.",
        a.id,
      ),
    ],
  };
}
export function submitIntake(
  s: State,
  c: Scope,
  answers: Record<string, string>,
  files: Application["answerFiles"],
  consent: boolean,
): State {
  assertWorkflow(s, c);
  assert(
    consent,
    "Confirme a finalidade demonstrativa e o aviso de privacidade.",
  );
  const form = s.forms.find((f) => f.id === s.central!.formId);
  assert(form, "Formulário geral indisponível.");
  const visible = visibleFields(form, answers);
  for (const f of visible) {
    assert(
      !f.required || answers[f.id]?.trim() || files[f.id],
      `Preencha ${f.label}.`,
    );
    if (files[f.id]) validFile(files[f.id]);
  }
  const mapped = (key: string) =>
      answers[visible.find((f) => f.mapping === key)?.id ?? ""] ?? "",
    email = mapped("email").trim(),
    old = s.candidates.find(
      (p) => !p.erased && normalized(p.email) === normalized(email),
    );
  assert(
    email && mapped("name").trim(),
    "Nome e e-mail precisam estar configurados no formulário geral.",
  );
  if (
    old &&
    currentCycles(s).some((a) => a.candidate === old.id && a.status === "Ativa")
  )
    return s;
  const p: Candidate = old ?? {
    id: uid(),
    name: mapped("name"),
    email,
    phone: mapped("phone"),
    city: mapped("city"),
    sector: mapped("sector"),
    education: mapped("education"),
    experience: mapped("experience"),
    skills: mapped("skills"),
    software: mapped("software"),
    availability: mapped("availability"),
    expected: Math.round(Number(mapped("expected") || 0) * 100),
    contracts: ["CLT", "Estágio", "PJ"],
    source: "Formulário geral",
    referral: "",
    tags: [],
    created: dateNow(),
    retentionUntil: addDays(s.privacy.days),
    consent: `Finalidade demonstrativa v${s.privacy.version}`,
    summary: mapped("notes"),
    claims: [],
    cv: files[visible.find((f) => f.mapping === "cv")?.id ?? ""],
    portfolio: files[visible.find((f) => f.mapping === "portfolio")?.id ?? ""],
  };
  let next = saveCandidate(s, c, p);
  next = {
    ...next,
    applications: next.applications.map((a) =>
      a.candidate === p.id && !a.historical ? { ...a, historical: true } : a,
    ),
  };
  const a = newCycle(
    next,
    c,
    p,
    form,
    Object.fromEntries(
      visible
        .filter((f) => answers[f.id] !== undefined)
        .map((f) => [f.id, answers[f.id]]),
    ),
    Object.fromEntries(
      visible.filter((f) => files[f.id]).map((f) => [f.id, files[f.id]]),
    ),
  );
  return {
    ...next,
    applications: [a, ...next.applications],
    relationships: [
      ...next.relationships!,
      relation(
        c,
        p.id,
        "Entrada",
        "Recebimento pelo formulário geral protegido, sem seleção de vaga.",
        a.id,
      ),
    ],
  };
}
function ensureAdmission(s: State, c: Scope, a: Application): State {
  if (s.admissions!.some((x) => x.application === a.id)) return s;
  const p = s.candidates.find((p) => p.id === a.candidate)!;
  assert(
    !s.employments!.some((e) => e.candidate === p.id && e.status === "Ativo"),
    "Há vínculo local ativo. Confirme o encerramento pelo Offboarding antes de nova admissão.",
  );
  const stages = structuredClone(s.central!.admissionStages[a.contract]);
  const x: Admission = {
    id: "admission:" + a.id,
    application: a.id,
    candidate: a.candidate,
    contract: a.contract,
    stage: stages[0].id,
    stages,
    rules: structuredClone(s.central!.documents[a.contract]),
    form: structuredClone(s.central!.admissionForms[a.contract]),
    fields: {},
    checks: {},
    files: {},
    answers: {},
    created: dateNow(),
    entered: dateNow(),
    owner: c.name,
    due: addDays(7),
    notes: "",
    externalRef: "",
    externalConfirmed: false,
    signedOn: "",
    start: dateNow(),
    amount: 0,
    state: "Aberta",
    token: uid(),
    events: [
      ev(
        c,
        "Admissão criada uma única vez. Aprovação para contratar não confirma vínculo ativo.",
      ),
    ],
  };
  return { ...s, admissions: [x, ...s.admissions!] };
}
export function moveCentral(
  s: State,
  c: Scope,
  ids: string[],
  target: string,
  reason: string,
): State {
  assertWorkflow(s, c);
  const st = stageOf(s, target);
  assert(
    st && reason.trim() && ids.length,
    "Informe etapa, candidatos e motivo.",
  );
  let next = s;
  for (const id of [...new Set(ids)]) {
    const a = next.applications.find((a) => a.id === id && !a.historical),
      p = next.candidates.find((p) => p.id === a?.candidate && !p.erased);
    assert(a && p, "Processo atual indisponível.");
    assert(
      !a.archived,
      "Reative o processo arquivado para uma nova oportunidade.",
    );
    if (a.stage === target) continue;
    if (a.status === "Contratada")
      throw new Error(
        "Contratação já formalizada. Preserve o ciclo; use Offboarding e novo processo para eventual recontratação.",
      );
    const closed = ["bank", "disqualified", "rejected", "declined"].includes(
      st.kind,
    );
    const fromBank = stageOf(next, a.stage)?.kind === "bank";
    const updated: Application = {
      ...a,
      stage: st.id,
      stages: a.stages.some((x) => x.id === st.id)
        ? a.stages.map((x) => (x.id === st.id ? structuredClone(st) : x))
        : [...a.stages, structuredClone(st)],
      entered: dateNow(),
      status: closed ? "Encerrada" : "Ativa",
      closedAt: closed ? now() : undefined,
      reason,
      fromBank: a.fromBank || fromBank,
      decision: st.kind === "hired" ? "Aprovado RH" : a.decision,
      visits: [...a.visits, { stage: st.id, at: now() }],
      events: [
        ...a.events,
        ev(
          c,
          `Movimentação livre: ${stageOf(next, a.stage)?.name ?? a.stage} → ${st.name}. ${reason}`,
        ),
      ],
    };
    next = {
      ...next,
      applications: next.applications.map((x) => (x.id === id ? updated : x)),
      relationships: [
        ...next.relationships!,
        relation(
          c,
          p.id,
          st.kind === "bank"
            ? "Banco de Talentos"
            : st.kind === "declined"
              ? "Proposta recusada"
              : "Movimentação",
          `${st.name}: ${reason}`,
          id,
        ),
      ],
    };
    next = automation(
      next,
      updated,
      "Mudança de etapa",
      updated.visits.at(-1)!.at + updated.id,
    );
    if (st.kind === "hired") next = ensureAdmission(next, c, updated);
  }
  return next;
}
export function reactivateCycle(
  s: State,
  c: Scope,
  id: string,
  reason: string,
): State {
  assertWorkflow(s, c);
  const a = s.applications.find((a) => a.id === id),
    p = s.candidates.find((p) => p.id === a?.candidate && !p.erased);
  assert(a && p && reason.trim(), "Informe processo, pessoa e motivo.");
  assert(
    !s.employments!.some((e) => e.candidate === p.id && e.status === "Ativo"),
    "Profissional com vínculo local ativo; recontratação depende do Offboarding confirmado.",
  );
  assert(
    !currentCycles(s).some(
      (other) =>
        other.candidate === p.id && other.id !== id && other.status === "Ativa",
    ),
    "Já existe outro processo operacional ativo para esta pessoa.",
  );
  if (
    !a.historical &&
    !a.archived &&
    !s.admissions!.some(
      (x) => x.application === a.id && x.state === "Cancelada",
    ) &&
    (a.status === "Ativa" || stageOf(s, a.stage)?.kind === "bank")
  )
    return moveCentral(
      s,
      c,
      [id],
      s.central!.stages.find((st) => st.kind === "entry")!.id,
      reason,
    );
  assert(
    p.rehire?.eligible !== "Não elegível",
    "Revisão da elegibilidade pelo RH é necessária antes de recontratar.",
  );
  const next = {
    ...s,
    applications: s.applications.map((x) =>
      x.candidate === p.id && !x.historical ? { ...x, historical: true } : x,
    ),
  };
  const created = newCycle(next, c, p);
  created.fromBank = stageOf(s, a.stage)?.kind === "bank" || a.fromBank;
  return {
    ...next,
    applications: [created, ...next.applications],
    relationships: [
      ...next.relationships!,
      relation(
        c,
        p.id,
        "Reativação",
        `Novo ciclo de relacionamento: ${reason}`,
        created.id,
      ),
    ],
  };
}
export function attachVacancy(
  s: State,
  c: Scope,
  ids: string[],
  job: string,
  contract?: Contract,
): State {
  assertWorkflow(s, c);
  const j = job
    ? s.jobs.find(
        (j) =>
          j.id === job &&
          !j.cancelled &&
          j.state !== "Encerrada" &&
          !j.filledAt,
      )
    : undefined;
  assert(!job || j, "Vaga não disponível.");
  const applications = s.applications.map((a) => {
    if (!ids.includes(a.id)) return a;
    assert(
      a.status !== "Contratada",
      "Vínculo formalizado preserva a vaga original.",
    );
    const p = s.candidates.find((p) => p.id === a.candidate)!;
    if (j)
      assert(
        p.contracts.includes(j.contract),
        "Vínculo da vaga não corresponde ao interesse cadastrado.",
      );
    assert(
      !s.admissions!.some(
        (x) =>
          x.application === a.id &&
          x.contract !== (j?.contract ?? contract ?? a.contract),
      ),
      "Admissão existente usa outro vínculo. Encerre/revise o processo antes de alterar.",
    );
    return {
      ...a,
      job: j?.id ?? "",
      jobTitle: j?.title ?? "Sem vaga vinculada",
      contract: j?.contract ?? contract ?? a.contract,
      sector: j?.sector ?? p.sector,
      events: [
        ...a.events,
        ev(
          c,
          j
            ? `Vaga vinculada pelo RH: ${j.title}.`
            : "Triagem mantida sem vaga vinculada.",
        ),
      ],
    };
  });
  return { ...s, applications };
}
export function validateExperience(
  s: State,
  c: Scope,
  id: string,
  level: string,
): State {
  assertWorkflow(s, c);
  assert(
    [...experienceLevels, "A confirmar"].includes(level),
    "Escolha nível validado ou a confirmar.",
  );
  return {
    ...s,
    candidates: s.candidates.map((p) =>
      p.id === id ? { ...p, validatedLevel: level } : p,
    ),
    relationships: [
      ...s.relationships!,
      relation(
        c,
        id,
        "Movimentação",
        `RH registrou nível validado: ${level}. Autodeclaração original preservada.`,
      ),
    ],
  };
}
export function rehireEligibility(
  s: State,
  c: Scope,
  id: string,
  eligible: NonNullable<Candidate["rehire"]>["eligible"],
  reason: string,
): State {
  assertWorkflow(s, c);
  assert(reason.trim(), "Justifique a revisão de elegibilidade.");
  return {
    ...s,
    candidates: s.candidates.map((p) =>
      p.id === id
        ? { ...p, rehire: { eligible, reason, by: c.name, at: now() } }
        : p,
    ),
    relationships: [
      ...s.relationships!,
      relation(c, id, "Elegibilidade", `${eligible}: ${reason}`),
    ],
  };
}
export function selectProcesses(
  s: State,
  filters: WorkflowFilters,
  bank = false,
) {
  const includes = (value: string, q: string) =>
    !q || normalized(value).includes(normalized(q));
  return currentCycles(s, !!filters.archived).filter((a) => {
    const p = s.candidates.find((p) => p.id === a.candidate)!;
    return (
      (!bank || stageOf(s, a.stage)?.kind === "bank") &&
      (!filters.archived || filters.archived !== "only" || !!a.archived) &&
      includes(
        [p.name, p.email, p.phone, ...p.tags].join(" "),
        filters.search,
      ) &&
      includes(p.sector, filters.area) &&
      includes(a.sector, filters.sector) &&
      includes(p.validatedLevel ?? p.experience, filters.level) &&
      includes(p.city, filters.city) &&
      includes(p.education, filters.education) &&
      includes(p.skills, filters.skills) &&
      includes(p.software, filters.software) &&
      includes(p.availability, filters.availability) &&
      (!filters.contract || a.contract === filters.contract) &&
      (!filters.job || a.job === filters.job) &&
      includes(p.source, filters.origin) &&
      includes(p.tags.join(" "), filters.tags) &&
      (!filters.stage || a.stage === filters.stage) &&
      (!filters.from || a.created >= filters.from) &&
      (!filters.until || a.created <= filters.until)
    );
  });
}
export function savePipeline(
  s: State,
  c: Scope,
  central: CentralConfig,
): State {
  assertWorkflow(s, c);
  assert(
    central.stages.length &&
      new Set(central.stages.map((x) => x.id)).size === central.stages.length,
    "Defina etapas distintas.",
  );
  for (const st of central.stages) {
    assert(
      st.name.trim() && /^#[0-9a-f]{6}$/i.test(st.color) && st.days >= 0,
      "Nome, cor e prazo inválidos.",
    );
    validateFields(st.fields);
  }
  assert(
    currentCycles(s).every((a) =>
      central.stages.some((st) => st.id === a.stage),
    ),
    "Etapa ocupada não pode ser removida; mova os cards primeiro.",
  );
  assert(
    !s.resumeVersion || !central.stages.some((st) => st.kind === "bank"),
    "Talento é uma classificação independente; use a estrela, sem coluna Banco de Talentos.",
  );
  for (const kind of (s.resumeVersion
    ? ["entry", "hired", "declined"]
    : ["entry", "hired", "bank", "declined"]) as (
    "entry" | "hired" | "bank" | "declined"
  )[])
    assert(
      central.stages.filter((st) => st.kind === kind).length === 1,
      `Mantenha uma etapa com função ${kind}.`,
    );
  for (const contract of ["CLT", "Estágio", "PJ"] as Contract[]) {
    const rows = central.admissionStages[contract];
    assert(
      rows.length && rows.some((st) => st.purpose === "final"),
      "Mantenha finalização em cada fluxo de admissão.",
    );
    assert(
      s
        .admissions!.filter(
          (a) => a.contract === contract && a.state === "Aberta",
        )
        .every((a) => rows.some((st) => st.id === a.stage)),
      "Etapa de admissão ocupada não pode desaparecer.",
    );
    for (const st of rows) {
      assert(
        /^#[0-9a-f]{6}$/i.test(st.color) && st.name.trim(),
        "Configure nome e cor da admissão.",
      );
      validateFields(st.fields);
    }
    validateFields(central.admissionForms[contract].fields);
  }
  assert(
    !central.documents.CLT.length && !central.admissionForms.CLT.fields.length,
    "CLT é acompanhada pela Flash; coleta documental interna não é habilitada.",
  );
  return {
    ...s,
    central: structuredClone(central),
    events: [
      ...s.events,
      ev(
        c,
        "Configuração dos fluxos atualizada. Snapshots de processos e admissões preservados.",
      ),
    ],
  };
}
export function saveVacancy(s: State, c: Scope, j: Job): State {
  assertWorkflow(s, c);
  assert(
    j.title.trim() &&
      j.sector.trim() &&
      j.positions > 0 &&
      Number.isInteger(j.positions) &&
      Number.isSafeInteger(j.budget) &&
      j.budget! >= 0,
    "Cargo, setor, posições e orçamento válidos são obrigatórios.",
  );
  assert(
    ["CLT", "Estágio", "PJ"].includes(j.contract) &&
      ["Expansão", "Substituição"].includes(j.hiringReason ?? "Expansão"),
    "Vínculo e motivo inválidos.",
  );
  assert(
    !s.jobs.find((x) => x.id === j.id)?.filledAt,
    "Vaga preenchida; crie uma nova para substituição.",
  );
  assert(
    j.positions >= s.employments!.filter((e) => e.job === j.id).length,
    "Posições não podem ser menores que contratações formalizadas.",
  );
  validateCriteria(j.criteria);
  assert(
    validDate(j.created) && (!j.forecast || validDate(j.forecast)),
    "Informe datas válidas da vaga.",
  );
  assert(
    j.cost === undefined || (Number.isSafeInteger(j.cost) && j.cost >= 0),
    "Custo inválido.",
  );
  return {
    ...s,
    jobs: [
      {
        ...structuredClone(j),
        revision: (s.jobs.find((x) => x.id === j.id)?.revision ?? 0) + 1,
      },
      ...s.jobs.filter((x) => x.id !== j.id),
    ],
  };
}
export function cancelVacancy(
  s: State,
  c: Scope,
  id: string,
  cancelled: boolean,
): State {
  assertWorkflow(s, c);
  assert(
    !s.jobs.find((j) => j.id === id)?.filledAt,
    "Vaga preenchida preservada no histórico.",
  );
  return {
    ...s,
    jobs: s.jobs.map((j) =>
      j.id === id
        ? { ...j, cancelled, state: "Encerrada", closed: dateNow() }
        : j,
    ),
  };
}
export function saveAdmission(s: State, c: Scope, x: Admission): State {
  assertWorkflow(s, c);
  const old = s.admissions!.find((a) => a.id === x.id);
  assert(
    old &&
      old.state === "Aberta" &&
      old.application === x.application &&
      old.candidate === x.candidate &&
      old.contract === x.contract,
    "Admissão não editável ou referências alteradas.",
  );
  for (const f of Object.values(x.files)) validFile(f);
  assert(
    validDate(x.start) && Number.isSafeInteger(x.amount) && x.amount >= 0,
    "Data de início e valor contratual inválidos.",
  );
  return {
    ...s,
    admissions: s.admissions!.map((a) =>
      a.id === x.id
        ? {
            ...old,
            owner: x.owner,
            due: x.due,
            notes: x.notes,
            externalRef: x.externalRef,
            externalConfirmed: x.externalConfirmed,
            signedOn: x.signedOn,
            start: x.start,
            amount: x.amount,
            fields: structuredClone(x.fields),
            checks: structuredClone(x.checks),
            files: structuredClone(x.files),
            answers: structuredClone(x.answers),
            events: [
              ...old.events,
              ev(c, "Dados da admissão atualizados localmente."),
            ],
          }
        : a,
    ),
  };
}
export function moveAdmission(
  s: State,
  c: Scope,
  id: string,
  stage: string,
): State {
  assertWorkflow(s, c);
  const a = s.admissions!.find((a) => a.id === id),
    st =
      a?.stages.find((st) => st.id === stage) ??
      s.central!.admissionStages[a?.contract ?? "CLT"].find(
        (st) => st.id === stage,
      );
  assert(a && st && a.state === "Aberta", "Admissão ou etapa indisponível.");
  return {
    ...s,
    admissions: s.admissions!.map((x) =>
      x.id === id
        ? {
            ...x,
            stage: st.id,
            entered: dateNow(),
            stages: x.stages.some((s) => s.id === st.id)
              ? x.stages
              : [...x.stages, structuredClone(st)],
            state: st.purpose === "canceled" ? "Cancelada" : x.state,
            events: [
              ...x.events,
              ev(
                c,
                `Admissão movida para ${st.name}. Não confirma vínculo por si só.`,
              ),
            ],
          }
        : x,
    ),
  };
}
export function submitAdmissionInfo(
  s: State,
  c: Scope,
  id: string,
  token: string,
  answers: Record<string, string>,
  files: Admission["files"],
): State {
  assertWorkflow(s, c);
  const x = s.admissions!.find(
    (x) => x.id === id && x.token === token && x.state === "Aberta",
  );
  assert(
    x && x.contract !== "CLT",
    "Formulário local indisponível; CLT permanece na Flash.",
  );
  for (const f of visibleFields(x.form, answers))
    assert(
      !f.required || answers[f.id]?.trim() || files[f.id],
      `Preencha ${f.label}.`,
    );
  for (const f of Object.values(files)) validFile(f);
  return saveAdmission(s, c, {
    ...x,
    answers: { ...x.answers, ...answers },
    files: { ...x.files, ...files },
  });
}
export function finalizeAdmission(
  s: State,
  c: Scope,
  id: string,
  confirmed: boolean,
  authorizedFields: string[],
): State {
  assertWorkflow(s, c);
  const x = s.admissions!.find((x) => x.id === id),
    a = s.applications.find((a) => a.id === x?.application),
    p = s.candidates.find((p) => p.id === x?.candidate && !p.erased);
  assert(
    x && a && p && confirmed,
    "Confirme a formalização demonstrativa pelo RH.",
  );
  if (x.state === "Confirmada") return s;
  assert(
    x.state === "Aberta" && validDate(x.start) && x.start <= dateNow(),
    "Admissão aberta e início não futuro obrigatórios para vínculo local ativo.",
  );
  assert(
    !s.employments!.some((e) => e.candidate === p.id && e.status === "Ativo"),
    "Pessoa já possui vínculo local ativo.",
  );
  if (x.contract === "CLT")
    assert(
      x.externalRef.trim() && x.externalConfirmed,
      "Registre a referência e confirmação externa da Flash, sem integração de API.",
    );
  else {
    assert(
      validDate(x.signedOn) && x.signedOn <= dateNow(),
      "Registre a data de assinatura confirmada.",
    );
    for (const doc of x.rules)
      assert(
        !doc.required || x.files[doc.id],
        `Documento obrigatório: ${doc.name}.`,
      );
    for (const f of visibleFields(x.form, x.answers))
      assert(
        !f.required || x.answers[f.id]?.trim() || x.files[f.id],
        `Informação de admissão obrigatória: ${f.label}.`,
      );
  }
  for (const st of x.stages) {
    assert(
      st.tasks.every((t) => !t.required || x.checks[`${st.id}:${t.id}`]),
      "Há checklist obrigatório pendente na admissão.",
    );
    const answers = Object.fromEntries(
      st.fields.map((f) => [f.id, x.fields[`${st.id}:${f.id}`] ?? ""]),
    );
    for (const f of visibleFields(
      {
        id: st.id,
        name: st.name,
        fields: st.fields,
        version: 1,
        message: "",
        color: "#000000",
      },
      answers,
    ))
      assert(
        !f.required || answers[f.id]?.trim(),
        "Há campo obrigatório pendente na admissão.",
      );
  }
  const j = s.jobs.find((j) => j.id === a.job);
  if (j) {
    assert(
      !j.cancelled &&
        !j.filledAt &&
        j.state !== "Encerrada" &&
        s.employments!.filter((e) => e.job === j.id).length < j.positions,
      "Vaga indisponível ou sem posições restantes.",
    );
    assert(
      x.amount <= (j.budget ?? 0) ||
        s.exceptions.some(
          (e) =>
            e.application === a.id &&
            e.amount === x.amount &&
            e.state === "Aprovada",
        ),
      "Valor acima do orçamento exige exceção aprovada pela Diretoria.",
    );
  }
  assert(
    authorizedFields.includes("name") &&
      authorizedFields.every((f) =>
        ["name", "email", "phone", "city"].includes(f),
      ),
    "Autorize apenas dados cadastrais necessários.",
  );
  assert(
    stageOf(s, a.stage)?.kind === "hired" && a.decision === "Aprovado RH",
    "Mantenha a aprovação de contratação no Processo Seletivo antes da formalização.",
  );
  if (s.employments!.some((e) => e.candidate === p.id))
    assert(
      p.rehire?.eligible === "Elegível",
      "RH deve revisar a elegibilidade antes da recontratação.",
    );
  const offer = s.offers.find((o) => o.application === a.id);
  assert(
    !offer || (offer.state === "Aceita" && offer.amount === x.amount),
    "Proposta existente precisa estar aceita e corresponder ao valor da formalização. Uma recusa anterior deve permanecer no ciclo histórico.",
  );
  const stamp = now(),
    endStage = x.stages.find((st) => st.purpose === "final")!;
  let next: State = {
    ...s,
    admissions: s.admissions!.map((ad) =>
      ad.id === id
        ? {
            ...ad,
            state: "Confirmada",
            stage: endStage.id,
            confirmedAt: stamp,
            events: [
              ...ad.events,
              ev(
                c,
                "Formalização confirmada pelo RH; vínculo demonstrativo local preparado, sem Auth ou Supabase.",
              ),
            ],
          }
        : ad,
    ),
    applications: s.applications.map((ap) =>
      ap.id === a.id
        ? { ...ap, status: "Contratada", closedAt: stamp, hiredAt: dateNow() }
        : ap,
    ),
    employments: [
      ...s.employments!,
      {
        id: "employment:" + id,
        org: c.org,
        candidate: p.id,
        application: a.id,
        admission: id,
        job: a.job,
        contract: x.contract,
        start: x.start,
        confirmedAt: stamp,
        status: "Ativo",
        origin: p.source,
      },
    ],
    relationships: [
      ...s.relationships!,
      relation(
        c,
        p.id,
        "Contratação",
        `Formalização ${x.contract} confirmada pelo RH.`,
        a.id,
      ),
    ],
  };
  if (j) {
    const count = next.employments!.filter((e) => e.job === j.id).length;
    next = {
      ...next,
      jobs: next.jobs.map((job) =>
        job.id === j.id && count >= j.positions
          ? {
              ...job,
              filledAt: dateNow(),
              state: "Encerrada",
              closed: dateNow(),
            }
          : job,
      ),
    };
  }
  next = prepareHandoff(next, c, a.id, authorizedFields);
  return next;
}
export function recordDeclinedOffer(
  s: State,
  c: Scope,
  id: string,
  reason: string,
): State {
  assertWorkflow(s, c);
  assert(reason.trim(), "Registre o motivo da recusa.");
  const offer = s.offers.find((o) => o.id === id),
    a = s.applications.find((a) => a.id === offer?.application);
  assert(offer && a, "Proposta indisponível.");
  const target = s.central!.stages.find((st) => st.kind === "declined")!;
  return moveCentral(
    {
      ...s,
      offers: s.offers.map((o) =>
        o.id === id
          ? {
              ...o,
              state: "Recusada",
              events: [...o.events, ev(c, `Recusa registrada: ${reason}`)],
            }
          : o,
      ),
    },
    c,
    [a.id],
    target.id,
    reason,
  );
}
export function workflowErase(
  s: State,
  c: Scope,
  id: string,
  reason: string,
): State {
  assertWorkflow(s, c);
  const next = erase(s, c, id, reason);
  return {
    ...next,
    admissions: next.admissions!.map((a) =>
      a.candidate === id
        ? {
            ...a,
            fields: {},
            checks: {},
            files: {},
            answers: {},
            notes: "",
            externalRef: "",
            token: "",
            events: [],
          }
        : a,
    ),
    relationships: next.relationships!.filter((r) => r.candidate !== id),
    candidates: next.candidates.map((p) =>
      p.id === id ? { ...p, rehire: undefined } : p,
    ),
  };
}
export function analyzeRequirements(
  s: State,
  c: Scope,
  ids: string[],
  criteria: Criterion[],
  job = "",
): State {
  assertWorkflow(s, c);
  const existing = s.jobs.find((j) => j.id === job),
    virtual: Job = existing ?? {
      ...s.jobs[0],
      id: "custom-requirements",
      criteria,
      revision: 1,
    };
  const source = {
    ...virtual,
    criteria,
  };
  assert(source.criteria.length, "Configure requisitos profissionais.");
  return {
    ...s,
    analyses: [
      ...ids.map((id) => {
        const p = s.candidates.find((p) => p.id === id && !p.erased);
        assert(p, "Talento não disponível.");
        return {
          id: uid(),
          candidate: id,
          job: source.id,
          jobRevision: source.revision,
          at: now(),
          result: structuredClone(match(source, p)),
        };
      }),
      ...s.analyses,
    ],
  };
}

export function vacancyState(
  s: State,
  c: Scope,
  id: string,
  state: Job["state"],
): State {
  assertWorkflow(s, c);
  const j = s.jobs.find((j) => j.id === id);
  assert(j && !j.filledAt, "Vaga preenchida ou indisponível.");
  return {
    ...s,
    jobs: s.jobs.map((j) =>
      j.id === id
        ? {
            ...j,
            state,
            cancelled: false,
            closed: state === "Encerrada" ? dateNow() : undefined,
          }
        : j,
    ),
    events: [
      ...s.events,
      ev(c, `Vaga gerencial ${j.title}: ${state}. Sem divulgação pública.`),
    ],
  };
}
export function duplicateVacancy(s: State, c: Scope, id: string): State {
  assertWorkflow(s, c);
  const j = s.jobs.find((j) => j.id === id);
  assert(j, "Vaga indisponível.");
  return saveVacancy(s, c, {
    ...structuredClone(j),
    id: uid(),
    title: j.title + " · cópia",
    state: "Rascunho",
    created: dateNow(),
    closed: undefined,
    filledAt: undefined,
    cancelled: false,
    token: uid(),
  });
}

export function saveWorkflowQuery(
  s: State,
  c: Scope,
  name: string,
  filters: WorkflowFilters,
): State {
  assertWorkflow(s, c);
  assert(name.trim(), "Nomeie a busca.");
  return {
    ...s,
    workflowQueries: [
      { id: uid(), name: name.trim(), filters: structuredClone(filters) },
      ...(s.workflowQueries ?? []),
    ],
  };
}
