import type { LeaderGoal } from "./leader-goals-model";
import {
  type Scope,
  type Contract,
  admin,
  assert,
  uid,
  dateNow,
  validDate,
} from "../career/model";
export type Kind = "Operacional" | "Comportamental" | "Liderança";
export const values = [
  "Postura de Dono",
  "Sede de Crescimento",
  "Melhoria Contínua",
  "Lealdade",
  "Atitude",
] as const;
export const dimensions = [
  "Entregas",
  "Qualidade",
  "Prazos",
  "Complexidade",
  "Resultados",
] as const;
export type Area = {
  id: string;
  name: string;
  functions: { id: string; name: string }[];
};
export type Member = {
  id: string;
  user: string;
  org: string;
  name: string;
  sector: string;
  functionId: string;
  contract: Contract;
  leader: string;
  isLeader: boolean;
};
export type Criterion = {
  id: string;
  name: string;
  dimension: string;
  question: string;
  weight: number;
  target: number;
  direction: "Maior é melhor" | "Menor é melhor";
  unit: string;
};
export type Template = {
  id: string;
  name: string;
  kind: Kind;
  sector: string;
  functionId: string;
  contracts: Contract[];
  leaderPerson: string;
  version: number;
  min: number;
  max: number;
  periodicity: string;
  criteria: Criterion[];
  updatedAt: string;
};
export type Cycle = {
  id: string;
  name: string;
  start: string;
  end: string;
  state: "Aberto" | "Encerrado";
};
export type Answer = {
  criterion: string;
  value: number | null;
  justification: string;
  evidence: string;
};
export type Event = { id: string; at: string; by: string; text: string };
export type Evaluation = {
  id: string;
  person: string;
  cycle: Cycle;
  template: Template;
  answers: Answer[];
  status:
    | "Rascunho"
    | "Em validação"
    | "Ajustes solicitados"
    | "Validada"
    | "Publicada";
  author: string;
  reviewer?: string;
  releasedAt?: string;
  events: Event[];
  consolidation?: string;
  reviewComment?: string;
};
export type Responsibility = {
  id: string;
  person: string;
  name: string;
  start: string;
  end: string;
  frequency: "Semanal" | "Quinzenal" | "Mensal" | "Personalizada";
  interval: number;
  criterion: string;
  endedOn?: string;
};
export type Occurrence = {
  id: string;
  responsibility: string;
  person: string;
  name: string;
  due: string;
  done: boolean;
  doneAt?: string;
  cancelled?: boolean;
  evidence: string;
  feedback: string;
  events: Event[];
};
export type Diary = {
  id: string;
  person: string;
  date: string;
  text: string;
  type: "Feedback" | "Acontecimento" | "Diário confidencial";
  by: string;
};
export type Category = {
  id: string;
  name: string;
  kind: Kind;
  sector: string;
  contracts: Contract[];
  badge: string;
  criteria: string;
  enabled: boolean;
};
export type Campaign = {
  id: string;
  name: string;
  year: number;
  semester: 1 | 2;
  prize: string;
  tie: "Empate compartilhado" | "Reconhecimento mais recente" | "Decisão do RH";
  tieOrder: string[];
  points: number;
};
export type Award = {
  id: string;
  person: string;
  category: Category;
  campaign: Campaign;
  month: string;
  message: string;
  phrase: string;
  photo: string;
  order: number;
  points: number;
  status: "Rascunho" | "Validado" | "Publicado";
  source?: string;
  regulation?: Regulation;
  author: string;
  validatedBy?: string;
  publishedAt?: string;
  events: Event[];
};
export type Regulation = {
  id: string;
  version: number;
  text: string;
  published: boolean;
  at: string;
  by: string;
};
export type PerformanceState = {
  leaderGoals?: LeaderGoal[];
  leaderPhotos?: Record<string, string>;
  version: 1;
  org: string;
  areas: Area[];
  people: Member[];
  templates: Template[];
  cycles: Cycle[];
  evaluations: Evaluation[];
  responsibilities: Responsibility[];
  occurrences: Occurrence[];
  diary: Diary[];
  categories: Category[];
  campaigns: Campaign[];
  awards: Award[];
  regulations: Regulation[];
};
export const evaluationLabel = (e: Pick<Evaluation, "template">, p: Member) =>
  p.contract === "PJ"
    ? "Indicadores de Entregas Contratuais"
    : `Desempenho ${e.template.kind}`;
const evt = (ctx: Scope, text: string): Event => ({
  id: uid(),
  at: new Date().toISOString(),
  by: ctx.name,
  text,
});
function org(s: PerformanceState, c: Scope) {
  assert(s.org === c.org, "Organização não autorizada.");
}
function manager(s: PerformanceState, c: Scope) {
  org(s, c);
  assert(admin(c), "Área exclusiva de RH e Diretoria.");
}
function hr(s: PerformanceState, c: Scope) {
  org(s, c);
  assert(c.rh, "Somente RH personaliza modelos e valida avaliações.");
}
export function mayEvaluate(
  s: PerformanceState,
  c: Scope,
  p: Member,
  kind: Kind,
) {
  const own = s.people.find((x) => x.user === c.user);
  return (
    s.org === c.org &&
    p.org === c.org &&
    p.user !== c.user &&
    (admin(c) ||
      (c.leader &&
        c.contract !== "PJ" &&
        kind !== "Liderança" &&
        p.leader === c.user &&
        p.sector === own?.sector &&
        !p.isLeader))
  );
}
export function projection(s: PerformanceState, c: Scope): PerformanceState {
  org(s, c);
  if (admin(c)) return s;
  const own = s.people.find((p) => p.user === c.user);
  const visible = s.people.filter(
    (p) =>
      p.org === c.org &&
      (p.user === c.user ||
        (c.leader &&
          c.contract !== "PJ" &&
          p.sector === own?.sector &&
          p.leader === c.user &&
          !p.isLeader)),
  );
  const evals =
    c.contract === "PJ"
      ? []
      : s.evaluations
          .filter((e) => {
            const p = visible.find((p) => p.id === e.person);
            return (
              p &&
              (p.user === c.user
                ? e.status === "Publicada"
                : mayEvaluate(s, c, p, e.template.kind))
            );
          })
          .map((e) => ({
            ...e,
            consolidation: undefined,
            reviewComment: undefined,
            events: e.events.filter(
              (v) =>
                v.text.startsWith("Publicação") ||
                visible.find((p) => p.id === e.person)?.user !== c.user,
            ),
          }));
  // Published recognitions are a separate public projection; evaluation references, notes and drafts never leave management.
  const awards = s.awards
    .filter((a) => a.status === "Publicado")
    .map((a) => ({
      ...a,
      source: undefined,
      author: "",
      validatedBy: undefined,
      events: [],
      category: { ...a.category, criteria: "" },
      campaign: {
        ...a.campaign,
        tieOrder: a.campaign.tieOrder.filter((id) =>
          s.awards.some(
            (v) =>
              v.status === "Publicado" &&
              v.person === id &&
              v.campaign.id === a.campaign.id,
          ),
        ),
      },
    }));
  const publicIds = new Set(awards.map((a) => a.person));
  return {
    version: 1,
    org: s.org,
    areas: s.areas,
    people: s.people
      .filter((p) => visible.some((v) => v.id === p.id) || publicIds.has(p.id))
      .map((p) =>
        visible.some((v) => v.id === p.id) ? p : { ...p, user: "", leader: "" },
      ),
    templates:
      c.leader && c.contract !== "PJ"
        ? s.templates.filter(
            (t) =>
              t.kind !== "Liderança" && (t.sector === own?.sector || !t.sector),
          )
        : [],
    cycles: c.leader && c.contract !== "PJ" ? s.cycles : [],
    evaluations: evals,
    leaderGoals: s.leaderGoals
      ?.filter((g) =>
        g.leaders.some((id) =>
          s.people.some((p) => p.id === id && p.user === c.user),
        ),
      )
      .map((g) => ({
        ...g,
        leaders: g.leaders.filter((id) =>
          s.people.some((p) => p.id === id && p.user === c.user),
        ),
      })),
    leaderPhotos: Object.fromEntries(
      Object.entries(s.leaderPhotos ?? {}).filter(([id]) =>
        s.people.some((p) => p.id === id && p.user === c.user),
      ),
    ),
    responsibilities: [],
    occurrences: [],
    diary: [],
    categories: s.categories
      .filter((x) => x.enabled || awards.some((a) => a.category.id === x.id))
      .map((x) => ({ ...x, criteria: "" })),
    campaigns: s.campaigns.map((x) => ({
      ...x,
      tieOrder: x.tieOrder.filter((id) =>
        awards.some((a) => a.person === id && a.campaign.id === x.id),
      ),
    })),
    awards,
    regulations: s.regulations.filter((r) => r.published),
  };
}
export function criterionResult(
  t: Template,
  a: Answer,
  criterion: Criterion,
): number | null {
  if (a.value === null) return null;
  if (t.kind === "Operacional")
    return criterion.direction === "Menor é melhor"
      ? a.value === 0
        ? 100
        : Math.min(100, (criterion.target / a.value) * 100)
      : Math.min(100, (a.value / criterion.target) * 100);
  return ((a.value - t.min) / (t.max - t.min)) * 100;
}
export function score(e: Evaluation) {
  const list = e.template.criteria
    .map((cr) => ({ cr, a: e.answers.find((a) => a.criterion === cr.id) }))
    .filter((x) => x.a && x.a.value !== null);
  const weight = list.reduce((n, x) => n + x.cr.weight, 0);
  return weight
    ? list.reduce(
        (n, x) =>
          n + criterionResult(e.template, x.a!, x.cr)! * (x.cr.weight / weight),
        0,
      )
    : null;
}
export function compatible(t: Template, p: Member) {
  return (
    t.contracts.includes(p.contract) &&
    (!t.sector || t.sector === p.sector) &&
    (!t.functionId || t.functionId === p.functionId) &&
    (!t.leaderPerson || t.leaderPerson === p.id) &&
    (p.contract !== "PJ" || t.kind === "Operacional") &&
    (t.kind !== "Liderança" || p.isLeader)
  );
}
export function saveTemplate(s: PerformanceState, c: Scope, t: Template) {
  hr(s, c);
  assert(
    t.name.trim() && t.periodicity.trim() && t.criteria.length,
    "Informe nome, periodicidade e critérios.",
  );
  assert(
    t.min < t.max && Number.isFinite(t.min) && Number.isFinite(t.max),
    "Escala inválida.",
  );
  assert(
    t.contracts.length &&
      (!t.contracts.includes("PJ") || t.kind === "Operacional"),
    "PJ utiliza somente indicadores de entregas contratuais.",
  );
  assert(
    !t.sector || s.areas.some((a) => a.id === t.sector),
    "Setor inválido.",
  );
  assert(
    !t.functionId ||
      s.areas
        .find((a) => a.id === t.sector)
        ?.functions.some((f) => f.id === t.functionId),
    "Função incompatível com setor.",
  );
  assert(
    !t.leaderPerson ||
      s.people.some(
        (p) =>
          p.id === t.leaderPerson &&
          p.isLeader &&
          p.contract !== "PJ" &&
          (!t.sector || p.sector === t.sector),
      ),
    "Líder incompatível.",
  );
  assert(
    new Set(t.criteria.map((x) => x.id)).size === t.criteria.length,
    "Critérios duplicados.",
  );
  assert(
    Number.isFinite(t.criteria.reduce((n, x) => n + x.weight, 0)),
    "Soma de pesos inválida.",
  );
  for (const x of t.criteria) {
    assert(
      x.name.trim() &&
        x.question.trim() &&
        Number.isFinite(x.weight) &&
        x.weight > 0,
      "Cada critério exige nome, pergunta e peso positivo.",
    );
    if (t.kind === "Operacional")
      assert(
        (dimensions as readonly string[]).includes(x.dimension) &&
          Number.isFinite(x.target) &&
          x.target > 0 &&
          x.unit.trim(),
        "Indicador operacional exige dimensão de entrega, meta positiva e unidade.",
      );
    if (t.kind === "Comportamental")
      assert(
        (values as readonly string[]).includes(x.dimension),
        "Valor cultural inválido.",
      );
  }
  const old = s.templates.find((x) => x.id === t.id);
  return {
    ...s,
    templates: [
      ...s.templates.filter((x) => x.id !== t.id),
      {
        ...structuredClone(t),
        version: (old?.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}
export function saveCycle(s: PerformanceState, c: Scope, v: Cycle) {
  hr(s, c);
  assert(
    v.name.trim() && validDate(v.start) && validDate(v.end) && v.start <= v.end,
    "Nome ou vigência inválidos.",
  );
  const old = s.cycles.find((x) => x.id === v.id);
  if (old && s.evaluations.some((e) => e.cycle.id === v.id))
    assert(
      old.start === v.start && old.end === v.end,
      "Preserve a vigência utilizada; crie outro ciclo.",
    );
  if (v.state === "Encerrado")
    assert(
      !s.evaluations.some(
        (e) =>
          e.cycle.id === v.id && !["Publicada", "Validada"].includes(e.status),
      ),
      "Existem avaliações em elaboração.",
    );
  return {
    ...s,
    cycles: [...s.cycles.filter((x) => x.id !== v.id), structuredClone(v)],
  };
}
export function createEvaluation(
  s: PerformanceState,
  c: Scope,
  personId: string,
  templateId: string,
  cycleId: string,
) {
  org(s, c);
  const p = s.people.find((p) => p.id === personId);
  const t = s.templates.find((t) => t.id === templateId);
  const cy = s.cycles.find((x) => x.id === cycleId && x.state === "Aberto");
  assert(
    p && t && cy && compatible(t, p) && mayEvaluate(s, c, p, t.kind),
    "Pessoa, modelo ou ciclo fora do seu escopo.",
  );
  assert(
    !s.evaluations.some(
      (e) =>
        e.person === p.id && e.cycle.id === cy.id && e.template.kind === t.kind,
    ),
    "Já existe uma avaliação deste tipo para a pessoa neste ciclo.",
  );
  const e: Evaluation = {
    id: uid(),
    person: p.id,
    template: structuredClone(t),
    cycle: structuredClone(cy),
    answers: t.criteria.map((cr) => ({
      criterion: cr.id,
      value: null,
      justification: "",
      evidence: "",
    })),
    status: "Rascunho",
    author: c.user,
    events: [evt(c, "Avaliação criada com cópia dos critérios de origem.")],
  };
  return { ...s, evaluations: [e, ...s.evaluations] };
}
function replaceEval(
  s: PerformanceState,
  c: Scope,
  e: Evaluation,
  patch: Partial<Evaluation>,
  text: string,
) {
  return {
    ...s,
    evaluations: s.evaluations.map((x) =>
      x.id === e.id
        ? { ...e, ...patch, events: [...e.events, evt(c, text)] }
        : x,
    ),
  };
}
export function saveEvaluation(
  s: PerformanceState,
  c: Scope,
  id: string,
  answers: Answer[],
  send: boolean,
) {
  org(s, c);
  const e = s.evaluations.find((e) => e.id === id),
    p = s.people.find((p) => p.id === e?.person);
  assert(
    e &&
      p &&
      mayEvaluate(s, c, p, e.template.kind) &&
      ["Rascunho", "Ajustes solicitados"].includes(e.status),
    "Avaliação não editável neste escopo.",
  );
  assert(
    s.cycles.some((x) => x.id === e.cycle.id && x.state === "Aberto"),
    "Ciclo encerrado.",
  );
  assert(
    answers.length === e.template.criteria.length &&
      new Set(answers.map((a) => a.criterion)).size === answers.length,
    "Responda somente aos critérios de origem.",
  );
  for (const cr of e.template.criteria) {
    const a = answers.find((a) => a.criterion === cr.id);
    assert(a, "Critério ausente.");
    assert(
      a.value === null ||
        (Number.isFinite(a.value) &&
          (e.template.kind === "Operacional"
            ? a.value >= 0
            : a.value >= e.template.min && a.value <= e.template.max)),
      "Resposta fora da escala.",
    );
    if (send)
      assert(
        a.justification.trim() && (a.value === null || a.evidence.trim()),
        "Explique Não observado/Não aplicável; respostas observadas exigem justificativa e referência da evidência.",
      );
  }
  return replaceEval(
    s,
    c,
    e,
    {
      answers: structuredClone(answers),
      status: send ? "Em validação" : "Rascunho",
    },
    send ? "Avaliação enviada à validação do RH." : "Rascunho salvo.",
  );
}
export function reviewEvaluation(
  s: PerformanceState,
  c: Scope,
  id: string,
  approve: boolean,
  comment: string,
) {
  hr(s, c);
  const e = s.evaluations.find((e) => e.id === id),
    p = s.people.find((p) => p.id === e?.person);
  assert(
    e && p && e.status === "Em validação",
    "Avaliação deve estar em validação.",
  );
  assert(
    p.user !== c.user && e.author !== c.user,
    "Não é permitida autoaprovação.",
  );
  assert(comment.trim(), "Registre o parecer do RH.");
  return replaceEval(
    s,
    c,
    e,
    {
      status: approve ? "Validada" : "Ajustes solicitados",
      reviewer: c.user,
      reviewComment: comment,
    },
    `RH ${approve ? "validou" : "solicitou ajustes"}: ${comment}`,
  );
}
export function releaseEvaluation(s: PerformanceState, c: Scope, id: string) {
  manager(s, c);
  const e = s.evaluations.find((e) => e.id === id);
  assert(
    e?.status === "Validada" && e.reviewer,
    "A avaliação precisa da validação do RH.",
  );
  return replaceEval(
    s,
    c,
    e,
    { status: "Publicada", releasedAt: new Date().toISOString() },
    "Publicação liberada explicitamente pela gestão. PJ permanece sem acesso ao módulo.",
  );
}
const dayAdd = (d: string, n: number) =>
  new Date(Date.parse(d + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
function monthAdd(d: string, n: number) {
  const x = new Date(d + "T12:00:00Z");
  const day = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const last = new Date(
    Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0),
  ).getUTCDate();
  x.setUTCDate(Math.min(last, day));
  return x.toISOString().slice(0, 10);
}
export function materialize(s: PerformanceState) {
  const out = [...s.occurrences],
    ids = new Set(out.map((x) => x.id));
  for (const r of s.responsibilities) {
    for (let n = 0; n < 1000; n++) {
      const due =
        r.frequency === "Mensal"
          ? monthAdd(r.start, n)
          : dayAdd(
              r.start,
              n *
                (r.frequency === "Semanal"
                  ? 7
                  : r.frequency === "Quinzenal"
                    ? 14
                    : r.interval),
            );
      if (due > r.end || (r.endedOn && due > r.endedOn)) break;
      const id = r.id + ":" + due;
      if (!ids.has(id)) {
        out.push({
          id,
          responsibility: r.id,
          person: r.person,
          name: r.name,
          due,
          done: false,
          evidence: "",
          feedback: "",
          events: [],
        });
        ids.add(id);
      }
    }
  }
  return { ...s, occurrences: out };
}
export function saveResponsibility(
  s: PerformanceState,
  c: Scope,
  r: Responsibility,
) {
  manager(s, c);
  assert(
    !s.responsibilities.some((x) => x.id === r.id),
    "Preserve a recorrência original e cadastre uma nova versão.",
  );
  assert(
    s.people.some(
      (p) => p.id === r.person && p.isLeader && p.contract !== "PJ",
    ),
    "Selecione uma liderança elegível.",
  );
  assert(
    r.name.trim() &&
      r.criterion.trim() &&
      validDate(r.start) &&
      validDate(r.end) &&
      r.start <= r.end &&
      Date.parse(r.end) - Date.parse(r.start) <= 366 * 86400000,
    "Informe nome, responsabilidade e período de até 366 dias.",
  );
  assert(
    Number.isInteger(r.interval) && r.interval >= 1 && r.interval <= 366,
    "Intervalo inválido.",
  );
  return materialize({
    ...s,
    responsibilities: [...s.responsibilities, structuredClone(r)],
  });
}
export function stopResponsibility(
  s: PerformanceState,
  c: Scope,
  id: string,
  today = dateNow(),
) {
  manager(s, c);
  assert(
    s.responsibilities.some((r) => r.id === id),
    "Recorrência não encontrada.",
  );
  return {
    ...s,
    responsibilities: s.responsibilities.map((r) =>
      r.id === id ? { ...r, endedOn: today } : r,
    ),
    occurrences: s.occurrences.map((o) =>
      o.responsibility === id && o.due > today && !o.done
        ? {
            ...o,
            cancelled: true,
            events: [
              ...o.events,
              evt(c, "Ocorrência futura cancelada; histórico preservado."),
            ],
          }
        : o,
    ),
  };
}
export function completeOccurrence(
  s: PerformanceState,
  c: Scope,
  id: string,
  done: boolean,
  evidence: string,
  feedback: string,
) {
  manager(s, c);
  const o = s.occurrences.find((o) => o.id === id);
  assert(o && !o.cancelled, "Ocorrência não encontrada ou cancelada.");
  assert(!done || evidence.trim(), "Descreva a evidência de conclusão.");
  return {
    ...s,
    occurrences: s.occurrences.map((x) =>
      x.id === id
        ? {
            ...x,
            done,
            doneAt: done ? new Date().toISOString() : undefined,
            evidence,
            feedback,
            events: [
              ...x.events,
              evt(
                c,
                done
                  ? "Conclusão registrada com evidência."
                  : "Ocorrência reaberta.",
              ),
            ],
          }
        : x,
    ),
  };
}
export function addDiary(
  s: PerformanceState,
  c: Scope,
  d: Omit<Diary, "id" | "by">,
) {
  manager(s, c);
  assert(
    s.people.some(
      (p) => p.id === d.person && p.isLeader && p.contract !== "PJ",
    ) &&
      validDate(d.date) &&
      d.text.trim(),
    "Informe liderança, data e registro.",
  );
  return { ...s, diary: [{ ...d, id: uid(), by: c.name }, ...s.diary] };
}
export function consolidate(s: PerformanceState, c: Scope, id: string) {
  manager(s, c);
  const e = s.evaluations.find((e) => e.id === id);
  assert(
    e &&
      e.template.kind === "Liderança" &&
      ["Rascunho", "Ajustes solicitados"].includes(e.status),
    "Selecione avaliação de liderança em rascunho.",
  );
  const items = s.occurrences.filter(
    (o) =>
      !o.cancelled &&
      o.person === e.person &&
      o.due >= e.cycle.start &&
      o.due <= e.cycle.end,
  );
  const notes = s.diary.filter(
    (d) =>
      d.person === e.person && d.date >= e.cycle.start && d.date <= e.cycle.end,
  );
  const text =
    `${items.filter((o) => o.done).length}/${items.length} responsabilidades concluídas. ${items.filter((o) => !o.done && o.due < dateNow()).length} pendentes fora do prazo.\n` +
    items
      .map(
        (o) =>
          `${o.due} · ${o.name}: ${o.done ? "Concluída" : "Pendente"} · ${o.evidence} · ${o.feedback}`,
      )
      .join("\n") +
    "\nDiário restrito:\n" +
    notes.map((d) => `${d.date} · ${d.type} · ${d.text}`).join("\n");
  return replaceEval(
    s,
    c,
    e,
    { consolidation: text },
    "Acompanhamento consolidado para análise humana. Nenhuma nota ou publicação foi atribuída automaticamente.",
  );
}
export function eligible(cat: Category, p: Member) {
  return (
    cat.enabled &&
    cat.contracts.includes(p.contract) &&
    (!cat.sector || cat.sector === p.sector) &&
    (cat.kind === "Liderança"
      ? p.isLeader && p.contract !== "PJ"
      : !p.isLeader) &&
    (cat.kind !== "Comportamental" || p.contract !== "PJ")
  );
}
export function saveCategory(s: PerformanceState, c: Scope, v: Category) {
  manager(s, c);
  assert(
    v.name.trim() && v.badge.trim() && v.criteria.trim() && v.contracts.length,
    "Informe categoria, selo, elegibilidade e critérios.",
  );
  assert(
    v.kind !== "Operacional" || s.areas.some((a) => a.id === v.sector),
    "Categoria operacional deve pertencer a um setor. Não há categoria geral.",
  );
  assert(
    v.kind === "Operacional" || !v.contracts.includes("PJ"),
    "Cultura e liderança não incluem PJ.",
  );
  return {
    ...s,
    categories: [
      ...s.categories.filter((x) => x.id !== v.id),
      structuredClone(v),
    ],
  };
}
export function saveCampaign(s: PerformanceState, c: Scope, v: Campaign) {
  manager(s, c);
  assert(
    v.name.trim() &&
      v.prize.trim() &&
      Number.isInteger(v.year) &&
      v.year >= 2020 &&
      v.year <= 2100 &&
      [1, 2].includes(v.semester) &&
      Number.isFinite(v.points) &&
      v.points > 0,
    "Configure nome, semestre, premiação demonstrativa e pontos positivos.",
  );
  assert(
    !s.campaigns.some(
      (x) => x.id !== v.id && x.year === v.year && x.semester === v.semester,
    ),
    "Já existe campanha para este semestre.",
  );
  const old = s.campaigns.find((x) => x.id === v.id);
  assert(
    !old ||
      !s.awards.some((a) => a.campaign.id === v.id) ||
      (old.year === v.year && old.semester === v.semester),
    "Preserve o semestre original de campanhas com reconhecimentos.",
  );
  assert(
    new Set(v.tieOrder).size === v.tieOrder.length &&
      v.tieOrder.every((id) => s.people.some((p) => p.id === id)),
    "Ordem de desempate inválida.",
  );
  return {
    ...s,
    campaigns: [
      ...s.campaigns.filter((x) => x.id !== v.id),
      structuredClone(v),
    ].sort((a, b) => b.year - a.year || b.semester - a.semester),
  };
}
export function inCampaign(month: string, c: Campaign) {
  return (
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month) &&
    Number(month.slice(0, 4)) === c.year &&
    (Number(month.slice(5)) <= 6 ? 1 : 2) === c.semester
  );
}
export function saveAward(
  s: PerformanceState,
  c: Scope,
  a: Pick<
    Award,
    | "id"
    | "person"
    | "month"
    | "message"
    | "phrase"
    | "photo"
    | "order"
    | "source"
  >,
  categoryId: string,
  campaignId: string,
) {
  manager(s, c);
  const p = s.people.find((p) => p.id === a.person && p.org === c.org),
    cat = s.categories.find((x) => x.id === categoryId),
    campaign = s.campaigns.find((x) => x.id === campaignId);
  assert(
    p && cat && campaign && eligible(cat, p) && inCampaign(a.month, campaign),
    "Elegibilidade, setor ou semestre incompatível.",
  );
  assert(
    a.message.trim() &&
      a.phrase.trim() &&
      Number.isInteger(a.order) &&
      a.order >= 1,
    "Informe mensagem, frase e ordem de apresentação.",
  );
  assert(
    !a.photo ||
      a.photo.startsWith("/demo/hall/") ||
      a.photo.startsWith("blob:"),
    "Use somente imagem demonstrativa local.",
  );
  const old = s.awards.find((x) => x.id === a.id);
  assert(
    !old || old.status === "Rascunho",
    "Reconhecimento validado/publicado é imutável.",
  );
  assert(
    !s.awards.some(
      (x) =>
        x.id !== a.id &&
        x.category.id === cat.id &&
        x.campaign.id === campaign.id &&
        x.month === a.month,
    ),
    "Já existe vencedor nesta categoria e mês.",
  );
  if (a.source) {
    const e = s.evaluations.find((e) => e.id === a.source);
    assert(
      e &&
        e.person === p.id &&
        e.template.kind === cat.kind &&
        ["Validada", "Publicada"].includes(e.status),
      "Selecione avaliação validada, do tipo e profissional corretos.",
    );
  }
  const award: Award = {
    ...structuredClone(a),
    category: structuredClone(cat),
    campaign: structuredClone(campaign),
    points: campaign.points,
    status: "Rascunho",
    regulation:
      old?.regulation ??
      structuredClone(s.regulations.filter((r) => r.published).at(-1)),
    author: c.user,
    events: [
      ...(old?.events ?? []),
      evt(c, "Preparação confidencial salva, sem divulgação."),
    ],
  };
  return { ...s, awards: [award, ...s.awards.filter((x) => x.id !== a.id)] };
}
export function validateAward(s: PerformanceState, c: Scope, id: string) {
  manager(s, c);
  const a = s.awards.find((x) => x.id === id),
    p = s.people.find((p) => p.id === a?.person);
  assert(
    a && p && a.status === "Rascunho" && eligible(a.category, p),
    "Reconhecimento inelegível ou já validado.",
  );
  assert(p.user !== c.user, "Não valide reconhecimento em benefício próprio.");
  return {
    ...s,
    awards: s.awards.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "Validado" as const,
            validatedBy: c.user,
            events: [
              ...x.events,
              evt(
                c,
                "Vencedor validado manualmente; divulgação ainda pendente.",
              ),
            ],
          }
        : x,
    ),
  };
}
export function publishAward(
  s: PerformanceState,
  c: Scope,
  id: string,
  consent: boolean,
  today = dateNow(),
) {
  manager(s, c);
  const a = s.awards.find((a) => a.id === id);
  assert(
    a?.status === "Validado" && a.validatedBy && consent,
    "Valide o vencedor e confirme explicitamente a divulgação.",
  );
  assert(
    a.month <= today.slice(0, 7),
    "Não divulgue vencedores de um mês futuro.",
  );
  return {
    ...s,
    awards: s.awards.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "Publicado" as const,
            publishedAt: new Date().toISOString(),
            events: [
              ...x.events,
              evt(
                c,
                "Reconhecimento divulgado explicitamente. Sem efeito financeiro ou de carreira.",
              ),
            ],
          }
        : x,
    ),
  };
}
export function saveRegulation(
  s: PerformanceState,
  c: Scope,
  text: string,
  published: boolean,
) {
  manager(s, c);
  assert(text.trim(), "Informe o regulamento.");
  return {
    ...s,
    regulations: [
      ...s.regulations,
      {
        id: uid(),
        version: s.regulations.length + 1,
        text,
        published,
        by: c.name,
        at: new Date().toISOString(),
      },
    ],
  };
}
export type Rank = {
  person: string;
  points: number;
  wins: number;
  latest: string;
  position: number;
};
export function ranking(
  s: PerformanceState,
  category: string,
  campaign: string,
): Rank[] {
  const rows = new Map<string, Rank>();
  const camp = s.campaigns.find((x) => x.id === campaign);
  for (const a of s.awards.filter(
    (a) =>
      a.status === "Publicado" &&
      a.category.id === category &&
      a.campaign.id === campaign,
  )) {
    const r = rows.get(a.person) ?? {
      person: a.person,
      points: 0,
      wins: 0,
      latest: "",
      position: 0,
    };
    r.points += a.points;
    r.wins++;
    r.latest = r.latest > a.month ? r.latest : a.month;
    rows.set(a.person, r);
  }
  const list = [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      (camp?.tie === "Reconhecimento mais recente"
        ? b.latest.localeCompare(a.latest)
        : camp?.tie === "Decisão do RH"
          ? (camp.tieOrder.indexOf(a.person) < 0
              ? 9999
              : camp.tieOrder.indexOf(a.person)) -
            (camp.tieOrder.indexOf(b.person) < 0
              ? 9999
              : camp.tieOrder.indexOf(b.person))
          : 0) ||
      a.person.localeCompare(b.person),
  );
  list.forEach((r, i) => {
    const prev = list[i - 1];
    const tied =
      prev &&
      prev.points === r.points &&
      (camp?.tie === "Empate compartilhado" ||
        (camp?.tie === "Reconhecimento mais recente" &&
          prev.latest === r.latest) ||
        (camp?.tie === "Decisão do RH" &&
          !camp.tieOrder.includes(prev.person) &&
          !camp.tieOrder.includes(r.person)));
    r.position = tied ? prev.position : i + 1;
  });
  return list;
}

/** A new semester starts empty; no winner or payment is generated. */
export function ensureSeason(
  s: PerformanceState,
  today = dateNow(),
): PerformanceState {
  const year = Number(today.slice(0, 4)),
    semester = (Number(today.slice(5, 7)) <= 6 ? 1 : 2) as 1 | 2;
  if (s.campaigns.some((c) => c.year === year && c.semester === semester))
    return s;
  return {
    ...s,
    campaigns: [
      {
        id: `campaign-${year}-${semester}`,
        name: `Temporada ${semester} · ${year}`,
        year,
        semester,
        points: 1,
        tie: "Empate compartilhado",
        tieOrder: [],
        prize: "Configuração demonstrativa pendente de revisão do RH.",
      },
      ...s.campaigns,
    ],
  };
}

/** Public Hall never serializes internal evaluations, including the viewer's own. */
export function hallProjection(
  s: PerformanceState,
  c: Scope,
): PerformanceState {
  const v = projection(s, c);
  if (admin(c)) return v;
  const ids = new Set(v.awards.map((a) => a.person));
  return {
    ...v,
    evaluations: [],
    templates: [],
    cycles: [],
    people: v.people
      .filter((p) => p.user === c.user || ids.has(p.id))
      .map((p) => (p.user === c.user ? p : { ...p, user: "", leader: "" })),
  };
}
